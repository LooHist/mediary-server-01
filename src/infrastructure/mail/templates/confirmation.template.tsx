import { Body, Heading, Link, Tailwind, Text } from "@react-email/components"
import { Html } from "@react-email/html"
import * as React from 'react'

interface ConfirmationTemplateProps {
	domain: string
	token: string
}

export function ConfirmationTemplate({
	domain,
	token
}: ConfirmationTemplateProps) {
	const confirmLink = `${domain}/auth/new-verification?token=${token}`

	return (
		<Tailwind>
			<Html>
				<Body className='text-black'>
				<Heading>Email Confirmation</Heading>
					<Text>
						Hello! To confirm your email address, please click the link below:
					</Text>
					<Link href={confirmLink}>Confirm Email</Link>
					<Text>
						This link is valid for 1 hour. If you did not request this confirmation, you can safely ignore this message.
					</Text>
				</Body>
			</Html>
		</Tailwind>
	)
}
