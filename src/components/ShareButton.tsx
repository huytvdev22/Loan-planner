import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  type: 'calculator' | 'comparison';
  data: any;
}

export function ShareButton({ type, data }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const json = JSON.stringify(data);
    const base64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
    }));
    
    const url = new URL(window.location.href);
    url.searchParams.set('tab', type);
    url.searchParams.set('data', base64);

    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" onClick={handleShare} className="gap-2">
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
      {copied ? 'Đã sao chép link' : 'Chia sẻ'}
    </Button>
  );
}
