 // src/components/ProfileUpload.tsx
import React, { useState } from 'react';
import { uploadImage, getImageUrl } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const ProfileUpload = ({ userId, onUpload }: { userId: string, onUpload: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `${fileName}`;

      await uploadImage(file, filePath);
      const url = getImageUrl(filePath);
      onUpload(url);
      toast.success('Profile picture uploaded successfully!');
    } catch (error) {
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label>
        {uploading ? 'Uploading...' : 'Upload profile picture'}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
};

export default ProfileUpload;
