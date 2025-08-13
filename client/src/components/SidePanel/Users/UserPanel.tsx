import { Button } from '@librechat/client';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react'; // ✅ icon bisa diganti
import { useLocalize } from '~/hooks';

const UserPanel = () => {
  const navigate = useNavigate();
  const localize = useLocalize();

  return (
    <div className="flex w-full justify-end">
      <Button
        variant="outline"
        className="w-full bg-transparent mx-2"
        onClick={() => navigate('/d/users/')}
      >
        <Users className="size-4 mr-2" aria-hidden />
        {localize('com_sidepanel_user_management')}
      </Button>
    </div>
  );
};

export default UserPanel;
