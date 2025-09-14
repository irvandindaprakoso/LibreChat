import { AlertTriangle, CreditCard, Calendar } from 'lucide-react';
import { Button } from '@librechat/client';
import { useNavigate } from 'react-router-dom';
import { SubscriptionCheckResult } from '~/hooks/useSubscriptionCheck';

interface SubscriptionWarningProps {
  subscriptionCheck: SubscriptionCheckResult;
  onClose?: () => void;
}

const SubscriptionWarning = ({ subscriptionCheck, onClose }: SubscriptionWarningProps) => {
  const navigate = useNavigate();
  const { reason, subscriptionStatus, plan, expiresAt } = subscriptionCheck;

  const handleUpgrade = () => {
    navigate('/subscriptions');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'inactive':
        return '🟡';
      case 'cancelled':
        return '🔴';
      case 'expired':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-800">
              Subscription Required
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            )}
          </div>
          
          <p className="text-sm text-red-700 mb-3">
            {reason}
          </p>

          {/* Subscription Details */}
          <div className="bg-white rounded-md p-3 mb-3 border border-red-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{plan || 'N/A'}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(subscriptionStatus)}`}>
                  {getStatusIcon(subscriptionStatus)} {subscriptionStatus?.toUpperCase() || 'N/A'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Expires:</span>
                <span className="font-medium">{formatDate(expiresAt)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleUpgrade}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium rounded-md"
            >
              Upgrade Subscription
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/subscriptions')}
              className="border-red-300 text-red-700 hover:bg-red-50 px-4 py-2 text-sm font-medium rounded-md"
            >
              View Plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionWarning;
