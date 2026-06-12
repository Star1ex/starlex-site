package service

import (
	"fmt"
	"net/smtp"
)

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

type EmailService struct {
	config EmailConfig
}

func NewEmailService(config EmailConfig) *EmailService {
	return &EmailService{config: config}
}

func (s *EmailService) SendRegistrationCode(to, firstName, code string) error {
	subject := "Verify Your Email - Starlex"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
				<h2 style="color: #000;">Welcome to Starlex, %s!</h2>
				<p>Thank you for registering. Please verify your email address to complete your registration.</p>
				<div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
					<p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your verification code is:</p>
					<h1 style="font-size: 36px; letter-spacing: 8px; color: #000; margin: 0;">%s</h1>
				</div>
				<p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
				<p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
				<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
				<p style="color: #999; font-size: 12px;">Starlex - Manage your projects efficiently</p>
			</div>
		</body>
		</html>	
	`, firstName, code)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) SendPasswordResetEmail(to, firstName, code, resetLink string, expiresMinutes int) error {
	subject := "Reset Your Password - Starlex"
	linkSection := ""
	if resetLink != "" {
		linkSection = fmt.Sprintf(`
			<p style="margin: 20px 0;">Or use this secure link:</p>
			<p style="text-align: center;">
				<a href="%s" style="display: inline-block; padding: 12px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
					Reset Password
				</a>
			</p>
		`, resetLink)
	}
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
				<h2 style="color: #000;">Hi %s,</h2>
				<p>We received a request to reset your Starlex password.</p>
				<div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
					<p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your reset code is:</p>
					<h1 style="font-size: 36px; letter-spacing: 8px; color: #000; margin: 0;">%s</h1>
				</div>
				%s
				<p style="color: #666; font-size: 14px;">This code expires in %d minutes and can only be used once.</p>
				<p style="color: #666; font-size: 14px;">If you didn’t request this, you can safely ignore this email.</p>
				<ul style="color: #666; font-size: 13px;">
					<li>Never share your reset code with anyone.</li>
					<li>Starlex support will never ask for your password.</li>
				</ul>
				<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
				<p style="color: #999; font-size: 12px;">Starlex - Securely manage your projects</p>
			</div>
		</body>
		</html>
	`, firstName, code, linkSection, expiresMinutes)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) SendPasswordResetConfirmation(to, firstName string) error {
	subject := "Your Password Was Reset - Starlex"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
				<h2 style="color: #000;">Hi %s,</h2>
				<p>Your Starlex password was successfully reset.</p>
				<p>If you did not perform this action, please reset your password immediately and contact support.</p>
				<ul style="color: #666; font-size: 13px;">
					<li>Review recent account activity.</li>
					<li>Enable multi-factor authentication if available.</li>
				</ul>
				<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
				<p style="color: #999; font-size: 12px;">Starlex - Securely manage your projects</p>
			</div>
		</body>
		</html>
	`, firstName)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) SendPasswordChangedConfirmation(to, firstName string) error {
	subject := "Your Password Was Changed - Starlex"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
				<h2 style="color: #000;">Hi %s,</h2>
				<p>Your Starlex password was changed successfully.</p>
				<p>If you did not perform this action, please reset your password immediately and contact support.</p>
				<ul style="color: #666; font-size: 13px;">
					<li>Use a strong, unique password.</li>
					<li>Enable multi-factor authentication if available.</li>
				</ul>
				<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
				<p style="color: #999; font-size: 12px;">Starlex - Securely manage your projects</p>
			</div>
		</body>
		</html>
	`, firstName)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) sendEmail(to, subject, body string) error {
	from := s.config.FromEmail
	password := s.config.SMTPPassword

	msg := []byte(fmt.Sprintf(
		"From: %s <%s>\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=UTF-8\r\n"+
			"\r\n"+
			"%s\r\n",
		s.config.FromEmail, from, to, subject, body,
	))

	auth := smtp.PlainAuth("", s.config.SMTPUsername, password, s.config.SMTPHost)
	addr := fmt.Sprintf("%s:%s", s.config.SMTPHost, s.config.SMTPPort)

	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}
