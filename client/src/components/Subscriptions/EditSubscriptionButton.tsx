import { useState } from 'react';
import { TooltipAnchor, OGDialogTrigger, EditIcon, Button } from '@librechat/client';
import type { TConversationTag } from 'librechat-data-provider';
import type { FC } from 'react';
import SubscriptionEditDialog from './SubscriptionEditDialog';
import { useLocalize } from '~/hooks';

const EditSubscriptionButton: FC<{
  subscription: TConversationTag;
  tabIndex?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}> = ({ subscription, tabIndex = 0, onFocus, onBlur }) => {
  const localize = useLocalize();
  const [open, setOpen] = useState(false);

  return (
    <SubscriptionEditDialog
      context="EditSubscriptionButton"
      subscription={subscription}
      open={open}
      setOpen={setOpen}
    >
      <OGDialogTrigger asChild>
        <TooltipAnchor
          description={localize('com_ui_edit')}
          render={
            <Button
              variant="ghost"
              aria-label={localize('com_ui_subscriptions_edit')}
              tabIndex={tabIndex}
              onFocus={onFocus}
              onBlur={onBlur}
              onClick={() => setOpen(!open)}
              className="h-8 w-8 p-0"
            >
              <EditIcon />
            </Button>
          }
        />
      </OGDialogTrigger>
    </SubscriptionEditDialog>
  );
};

export default EditSubscriptionButton;
