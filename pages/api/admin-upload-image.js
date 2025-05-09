import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
    let safeFilename = filename;
    if (typeof filename === 'object' && filename !== null) {
      safeFilename = filename.originalname || 'upload.jpg';
    }
    const filePath = `${Date.now()}-${safeFilename}`;
    const chunks = [];
    file.on('data', (data) => chunks.push(data));
    file.on('end', async () => {
      const buffer = Buffer.concat(chunks);
      const { error } = await supabase.storage.from('products').upload(filePath, buffer, {
        contentType: mimetype || file.mimetype || 'image/jpeg',
        upsert: true,
      });
      if (error) {
        uploadError = error.message;
      } else {
        const { publicURL: url } = supabase.storage.from('products').getPublicUrl(filePath);
        publicURL = url;
      }
      // End the response here, since we only support one file per request
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
