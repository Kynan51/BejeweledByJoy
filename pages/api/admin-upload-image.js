import { createClient } from '@supabase/supabase-js';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

console.log('SUPABASE ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const busboy = require('busboy');
  const bb = busboy({ headers: req.headers });

  let fileUploaded = false;
  let uploadError = null;
  let publicURL = null;

  bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
    fileUploaded = true;
    let safeFilename = filename || `upload.jpg`;
    if (typeof filename === 'object' && filename !== null) {
      safeFilename = filename.originalname || 'upload.jpg';
    }
    const filePath = `${Date.now()}-${safeFilename}`;
    const chunks = [];
    file.on('data', (data) => chunks.push(data));
    file.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      const contentType = mimetype || 'image/jpeg';
      const { data: uploadData, error: uploadErrorObj } = await supabaseService.storage.from('products').upload(filePath, buffer, {
        contentType,
        upsert: true,
      });
      console.log('Upload attempt:', { filePath, mimetype, contentType, uploadData, uploadErrorObj });
      if (uploadErrorObj) {
        uploadError = uploadErrorObj.message;
      } else {
        const { data: listData, error: listError } = await supabaseService.storage.from('products').list('', { limit: 100 });
        console.log('Bucket file list after upload:', { listData, listError });
        // Use anon client for public URL
        let url, urlError;
        const publicUrlResult = supabaseAnon.storage.from('products').getPublicUrl(filePath);
        url = publicUrlResult.publicURL;
        urlError = publicUrlResult.error;
        console.log('Public URL generation:', { filePath, url, urlError });
        // Fallback: construct the public URL manually if getPublicUrl fails
        if (!url) {
          const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]?.split('.')[0];
          if (projectRef) {
            url = `https://${projectRef}.supabase.co/storage/v1/object/public/products/${filePath}`;
            console.log('Manual public URL fallback:', url);
          }
        }
        publicURL = url;
      }
      if (uploadError) {
        return res.status(500).json({ error: uploadError });
      }
      if (!publicURL) {
        return res.status(500).json({ error: 'Image upload failed or no public URL.' });
      }
      return res.status(200).json({ url: publicURL });
    });
  });

  bb.on('finish', () => {
    if (!fileUploaded) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    // If file.on('end') already sent the response, do nothing
  });

  req.pipe(bb);
}
