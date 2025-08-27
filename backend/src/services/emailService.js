const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendEmail(to, subject, html, text) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AIカウンセリング <noreply@aicounseling.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error('メールの送信に失敗しました');
    }
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>メールアドレスの確認</h1>
            </div>
            <div class="content">
              <p>AIカウンセリングへのご登録ありがとうございます。</p>
              <p>以下のボタンをクリックして、メールアドレスを確認してください：</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">メールアドレスを確認</a>
              </div>
              <p style="color: #666; font-size: 14px;">このリンクは24時間有効です。</p>
              <p style="color: #666; font-size: 14px;">ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください：</p>
              <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
            </div>
            <div class="footer">
              <p>このメールに心当たりがない場合は、無視してください。</p>
              <p>&copy; 2024 AIカウンセリング. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      email,
      'メールアドレスの確認 - AIカウンセリング',
      html
    );
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>パスワードリセット</h1>
            </div>
            <div class="content">
              <p>パスワードリセットのリクエストを受け付けました。</p>
              <p>以下のボタンをクリックして、新しいパスワードを設定してください：</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">パスワードをリセット</a>
              </div>
              <div class="warning">
                <strong>⚠️ セキュリティに関する重要なお知らせ</strong>
                <p>このリンクは1時間有効です。パスワードリセット後は、すべてのデバイスから再度ログインが必要になります。</p>
              </div>
              <p style="color: #666; font-size: 14px;">ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください：</p>
              <p style="color: #666; font-size: 12px; word-break: break-all;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>このリクエストに心当たりがない場合は、このメールを無視してください。</p>
              <p>パスワードは変更されません。</p>
              <p>&copy; 2024 AIカウンセリング. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      email,
      'パスワードリセット - AIカウンセリング',
      html
    );
  }

  async sendPasswordChangeConfirmation(email) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00d2ff 0%, #3a47d5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 10px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>パスワード変更完了</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>✅ パスワードが正常に変更されました</strong>
              </div>
              <p>お客様のアカウントのパスワードが正常に変更されました。</p>
              <p><strong>セキュリティのため、すべてのデバイスからログアウトされました。</strong></p>
              <p>新しいパスワードで再度ログインしてください。</p>
              <h3>セキュリティに関する推奨事項：</h3>
              <ul>
                <li>パスワードは定期的に変更してください</li>
                <li>他のサービスと同じパスワードを使用しないでください</li>
                <li>二要素認証を有効にすることを検討してください</li>
              </ul>
            </div>
            <div class="footer">
              <p>このメールに心当たりがない場合は、直ちにサポートにご連絡ください。</p>
              <p>&copy; 2024 AIカウンセリング. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      email,
      'パスワード変更のお知らせ - AIカウンセリング',
      html
    );
  }

  async sendWelcomeEmail(email, username) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ようこそ、${username}さん！</h1>
              <p>AIカウンセリングへの登録ありがとうございます</p>
            </div>
            <div class="content">
              <h2>🎉 アカウントが作成されました</h2>
              <p>AIカウンセリングへようこそ！私たちは、あなたの心の健康をサポートする準備ができています。</p>
              
              <h3>利用可能な機能：</h3>
              <div class="feature">
                <strong>💬 24時間AIカウンセリング</strong>
                <p>いつでもどこでも、AIカウンセラーと対話できます</p>
              </div>
              <div class="feature">
                <strong>📊 進捗トラッキング</strong>
                <p>あなたの成長と改善を可視化します</p>
              </div>
              <div class="feature">
                <strong>🔒 完全なプライバシー</strong>
                <p>あなたの情報は安全に保護されています</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL}/dashboard" class="button">ダッシュボードへ</a>
              </div>
              
              <h3>次のステップ：</h3>
              <ol>
                <li>プロフィールを完成させる</li>
                <li>最初のセッションを予約する</li>
                <li>目標を設定する</li>
              </ol>
            </div>
            <div class="footer">
              <p>ご質問がございましたら、お気軽にお問い合わせください。</p>
              <p>&copy; 2024 AIカウンセリング. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(
      email,
      'AIカウンセリングへようこそ！',
      html
    );
  }
}

module.exports = new EmailService();