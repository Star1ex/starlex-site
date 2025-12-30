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

func NewEmailConfig(config EmailConfig) *EmailService {
	return &EmailService{config: config}
}

func (s *EmailService) SendVerificationCode(to, firstName, code string) error {
	subject := "Verify Your Email - TeamTrack"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
				<h2 style="color: #000;">Welcome to Team Track, %s!</h2>
				<p>Thank you for registering. Please verify your email address to complete your registration.</p>
				<div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
					<p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your verification code is:</p>
					<h1 style="font-size: 36px; letter-spacing: 8px; color: #000; margin: 0;">%s</h1>
				</div>
				<p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
				<p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
				<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
				<p style="color: #999; font-size: 12px;">Team Track - Manage your projects efficiently</p>
			</div>
		</body>
		</html>	
	`, firstName, code)

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
