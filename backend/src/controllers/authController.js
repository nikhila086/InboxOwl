exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Session destruction failed' });
      }
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      });
      res.json({ success: true });
    });
  });
};
