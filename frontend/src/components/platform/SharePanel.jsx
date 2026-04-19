import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Check, Copy, Twitter, Facebook, Linkedin, MessageCircle, Share2 } from 'lucide-react';

/**
 * Compact share bar — Copy Link + X + Facebook + LinkedIn + WhatsApp.
 * Uses lucide-react icons and native window.open for share URLs so no
 * third-party SDKs are required.
 */
const SharePanel = ({ url, title }) => {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareTargets = [
    {
      name: 'X',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: 'hover:bg-slate-900 hover:text-white hover:border-slate-900',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'hover:bg-blue-600 hover:text-white hover:border-blue-600',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className: 'hover:bg-sky-700 hover:text-white hover:border-sky-700',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      className: 'hover:bg-green-600 hover:text-white hover:border-green-600',
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 sm:gap-3 py-3"
      data-testid="share-panel"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mr-1">
        <Share2 className="h-4 w-4 text-purple-600" />
        Share:
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleCopy}
        data-testid="share-copy-btn"
        className={`gap-2 border-2 transition-all duration-200 ${
          copied
            ? 'bg-green-50 text-green-700 border-green-300'
            : 'border-purple-200 text-purple-700 hover:bg-purple-600 hover:text-white hover:border-purple-600'
        }`}
      >
        {copied ? (
          <><Check className="h-4 w-4" />Copied!</>
        ) : (
          <><Copy className="h-4 w-4" />Copy link</>
        )}
      </Button>

      {shareTargets.map(({ name, icon: Icon, href, className }) => (
        <Button
          key={name}
          asChild
          size="sm"
          variant="outline"
          data-testid={`share-${name.toLowerCase()}-btn`}
          className={`gap-2 border-2 border-slate-200 text-slate-600 transition-all duration-200 ${className}`}
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${name}`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{name}</span>
          </a>
        </Button>
      ))}
    </div>
  );
};

export default SharePanel;
