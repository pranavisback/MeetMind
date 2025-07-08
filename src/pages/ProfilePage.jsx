import { useUser } from '@clerk/clerk-react';
import ProfileEditor from '../components/profile/ProfileEditor';

const ProfilePage = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  const handleConnect = (id) => {
    console.log(`Connecting to profile with ID: ${id}`);
    // Add connection logic here
  };

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Please sign in.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileEditor userId={user.id} onConnect={handleConnect} />
    </div>
  );
};

export default ProfilePage;
