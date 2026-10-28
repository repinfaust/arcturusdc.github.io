export const state = { messages: [], failure: null, accepted: ['info@arcturusdc.com'], closed: 0 };
export default {
  createTransport() {
    return {
      async sendMail(message) {
        state.messages.push(message);
        if (state.failure) throw state.failure;
        return { accepted: state.accepted };
      },
      close() { state.closed++; },
    };
  },
};
