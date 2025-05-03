 // src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import ProfileUpload from '../components/ProfileUpload';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const [profileUrl, setProfileUrl] = useState('');

  return (
    <div>
      <h1>Profile</h1>
      {profileUrl && <img src={profileUrl} alt="Profile" style={{ width: 100, height: 100 }} />}
      <ProfileUpload 
        userId="user-id-here" 
        onUpload={(url) => setProfileUrl(url)} 
      />
      <button onClick={() => toast.success('Test notification')}>
        Test Toast
      </button>
    </div>
  );
};

export default ProfilePage;
