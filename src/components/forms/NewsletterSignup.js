import React from 'react';
import TallyEmbed, { NEWSLETTER_FORM_URL } from './TallyEmbed';

function NewsletterSignup({ title = 'experimenting is cool, i think' }) {
  return (
    <TallyEmbed
      formUrl={NEWSLETTER_FORM_URL}
      title={title}
    />
  );
}

export default NewsletterSignup;
