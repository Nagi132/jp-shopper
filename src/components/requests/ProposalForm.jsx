'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function ProposalForm({ 
  onSubmit, 
  onCancel,
  loading = false,
  className = ""
}) {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(message);
  };
  
  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle>Send Proposal</CardTitle>
        <CardDescription>
          Let the customer know why you're the right shopper for this request
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="proposal-message">Message to Customer</Label>
              <Textarea
                id="proposal-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you're a good fit for this request. Mention your experience with similar items, your location in Japan, etc."
                rows={5}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Proposal'
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}