"use client"
import Link from "next/link"

export default function FooterContacts() {
  return (
    <div className="flex flex-col md:flex-row md:justify-between items-center gap-2 text-sm text-gray-600 mt-4 w-full px-2">
      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 w-full sm:w-auto text-center">
        <span className="font-medium">Contact Us:</span>{' '}
        <a href="mailto:info@bejeweledbyjoy.com" className="text-purple-700 hover:underline break-all">info@bejeweledbyjoy.com</a>{' '}|
        <a href="tel:+254759840063" className="text-purple-700 hover:underline ml-1">+254759840063</a>
      </div>
      <div className="flex items-center gap-3 mt-2 md:mt-0 w-full sm:w-auto justify-center md:justify-end">
        <a href="https://www.facebook.com/bejeweledbyjoy" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          {/* Facebook SVG */}  
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="inline-block align-middle text-gray-500 hover:text-purple-700 transition-colors"><path fill="currentColor" d="M12 2.04c-5.52 0-9.96 4.44-9.96 9.96 0 4.99 3.66 9.12 8.44 9.87v-6.98h-2.54V12h2.54V9.8c0-2.51 1.48-3.9 3.73-3.9 1.08 0 2.23.19 2.23.19v2.45h-1.26c-1.24 0-1.62.77-1.62 1.56V12h2.73l-.44 2.83h-2.29v6.98c4.78-.75 8.44-4.88 8.44-9.87C21.96 6.48 17.52 2.04 12 2z"/></svg>
        </a>
        <a href="https://twitter.com/bejeweledbyjoy" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
          {/* X (Twitter) SVG */}
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="inline-block align-middle text-gray-500 hover:text-purple-700 transition-colors"><path fill="currentColor" d="M17.53 3H21.5l-7.39 8.42L23 21h-6.6l-5.2-6.6L4.5 21H.5l7.93-9.02L1 3h6.7l4.5 5.7L17.53 3zm-1.13 15.5h2.1L7.1 5.5h-2.1l11.4 13z"/></svg>
        </a>
        <a href="https://instagram.com/bejeweledbyjoy" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          {/* Instagram SVG */}
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="inline-block align-middle text-gray-500 hover:text-purple-700 transition-colors"><rect width="18" height="18" x="3" y="3" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17" cy="7" r="1.5" fill="currentColor"/></svg>
        </a>
        <a href="https://tiktok.com/@bejeweledbyjoy" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          {/* TikTok SVG */}
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="inline-block align-middle text-gray-500 hover:text-purple-700 transition-colors"><path fill="currentColor" d="M19.5 8.5c-1.93 0-3.5-1.57-3.5-3.5V3h-3v12.13a2.13 2.13 0 1 1-2.13-2.13c.12 0 .24.01.36.03V10.5a5.13 5.13 0 1 0 5.13 5.13V10.5c.97.63 2.13 1 3.37 1V8.5z"/></svg>
        </a>
      </div>
    </div>
  )
}
