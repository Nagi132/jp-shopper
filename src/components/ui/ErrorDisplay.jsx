// src/components/ui/ErrorDisplay.jsx
import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="space-y-6">
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="text-red-500 mr-2" />
            <h2 className="text-lg font-medium text-red-700">Something went wrong</h2>
          </div>
          <p className="text-red-600 mb-6">
            {typeof error === 'string' ? error : 'Failed to load data'}
          </p>
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}