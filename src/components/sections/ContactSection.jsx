import { useState }      from 'react';
import { useForm }       from 'react-hook-form';
import { zodResolver }   from '@hookform/resolvers/zod';
import { z }             from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import { SystemPanel }   from '../ui/SystemPanel';
import { GlowButton }    from '../ui/GlowButton';
import { sendToWhatsApp } from '../../utils/whatsapp';
import { Mail, MessageSquare, User } from 'lucide-react';
import { useUser }       from '../../context/UserContext';

const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be under 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be under 1000 characters'),
});

export function ContactSection() {
  const { userData } = useUser();
  const contact = userData?.contact ?? {};

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ resolver: zodResolver(schema) });

  const [status, setStatus] = useState(null);

  const onSubmit = async (data) => {
    setStatus(null);
    // Use the user's whatsapp number from their profile
    const result = await sendToWhatsApp(data, contact.whatsappNumber);
    setStatus(result.success ? 'accepted' : 'failed');
    if (result.success) reset();
  };

  return (
    <section id="contact" className="section" style={{ background: 'var(--color-cream)' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '620px' }}>
          <RevealOnScroll>
            <h2 className="section-heading">NEW QUEST AVAILABLE</h2>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <SystemPanel>
              <div className="panel-header">
                <span>CONNECT WITH THE HUNTER</span>
              </div>

              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', lineHeight: '1.6' }}>
                Accept this quest to send a message directly to {userData?.meta?.displayName ?? 'the Hunter'}.
                Your details will be delivered via WhatsApp.
              </p>

              <form
                className="quest-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                aria-label="Contact form"
              >
                {/* Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name">
                    <User size={10} style={{ display: 'inline', marginRight: 4 }} />
                    NAME
                  </label>
                  <input
                    id="contact-name"
                    className={`form-input${errors.name ? ' error' : ''}`}
                    placeholder="Your full name"
                    autoComplete="name"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <span id="name-error" className="form-error" role="alert">
                      ⚠ {errors.name.message}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email">
                    <Mail size={10} style={{ display: 'inline', marginRight: 4 }} />
                    EMAIL
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    className={`form-input${errors.email ? ' error' : ''}`}
                    placeholder="your@email.com"
                    autoComplete="email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <span id="email-error" className="form-error" role="alert">
                      ⚠ {errors.email.message}
                    </span>
                  )}
                </div>

                {/* Message */}
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">
                    <MessageSquare size={10} style={{ display: 'inline', marginRight: 4 }} />
                    MESSAGE
                  </label>
                  <textarea
                    id="contact-message"
                    className={`form-textarea${errors.message ? ' error' : ''}`}
                    placeholder="Describe your quest..."
                    {...register('message')}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'msg-error' : undefined}
                  />
                  {errors.message && (
                    <span id="msg-error" className="form-error" role="alert">
                      ⚠ {errors.message.message}
                    </span>
                  )}
                </div>

                <div className="form-actions">
                  <GlowButton type="submit" onClick={handleSubmit(onSubmit)}>
                    {isSubmitting ? 'DISPATCHING...' : 'ACCEPT QUEST'}
                  </GlowButton>
                </div>
              </form>

              <AnimatePresence>
                {status === 'accepted' && (
                  <motion.div
                    className="quest-success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="status"
                    aria-live="polite"
                  >
                    ✔ QUEST ACCEPTED — Message delivered to the Hunter.
                  </motion.div>
                )}
                {status === 'failed' && (
                  <motion.div
                    className="quest-failed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="alert"
                    aria-live="assertive"
                  >
                    ✕ TRANSMISSION FAILED — Try emailing {contact.email} directly.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alternative contact */}
              <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                {contact.email && <span>✉ {contact.email}</span>}
                {contact.location && <span>📍 {contact.location}</span>}
                {contact.linkedin && (
                  <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-charcoal)' }}>
                    LinkedIn →
                  </a>
                )}
              </div>
            </SystemPanel>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
