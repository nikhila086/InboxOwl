// Email utility functions

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const parseEmailAddresses = (emailString) => {
  if (!emailString) return [];
  return emailString
    .split(/[,;]/)
    .map(email => email.trim())
    .filter(email => email);
};

export const formatEmailForReply = (originalEmail) => {
  const date = new Date(originalEmail.date).toLocaleString();
  return `

--- Original Message ---
From: ${originalEmail.sender} <${originalEmail.senderEmail}>
Date: ${date}
Subject: ${originalEmail.subject}

${originalEmail.body || originalEmail.content || originalEmail.snippet || ''}`;
};

export const formatEmailForForward = (originalEmail) => {
  const date = new Date(originalEmail.date).toLocaleString();
  return `

---------- Forwarded message ---------
From: ${originalEmail.sender} <${originalEmail.senderEmail}>
Date: ${date}
Subject: ${originalEmail.subject}
To: ${originalEmail.recipient || 'Unknown'}

${originalEmail.body || originalEmail.content || originalEmail.snippet || ''}`;
};

export const createEmailTemplate = (type, recipientName = '') => {
  const templates = {
    business: `Dear ${recipientName || '[Name]'},

I hope this email finds you well. I am writing to 

Best regards,
[Your Name]`,
    
    meeting: `Hi ${recipientName || '[Name]'},

I would like to schedule a meeting to discuss 

Could you let me know your availability for next week?

Looking forward to hearing from you.

Best regards,
[Your Name]`,
    
    followUp: `Hi ${recipientName || '[Name]'},

I wanted to follow up on our previous conversation regarding 

Please let me know if you need any additional information.

Thank you,
[Your Name]`,
    
    introduction: `Hello ${recipientName || '[Name]'},

I hope you're doing well. I'm reaching out to introduce 

I believe this could be mutually beneficial, and I'd love to explore this further.

Best regards,
[Your Name]`
  };
  
  return templates[type] || '';
};

export const getEmailSignature = () => {
  // This could be stored in localStorage or user preferences
  return localStorage.getItem('emailSignature') || '';
};

export const setEmailSignature = (signature) => {
  localStorage.setItem('emailSignature', signature);
};