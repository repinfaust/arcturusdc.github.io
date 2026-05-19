import DialledMtbFeedbackClient from '../DialledMtbFeedbackClient';

export const metadata = {
  title: 'User Feedback — Dialled MTB',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DialledMtbFeedbackPage() {
  return <DialledMtbFeedbackClient />;
}
