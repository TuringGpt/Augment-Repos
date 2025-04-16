const {
    NEW_EVENT_ADD_REACTION,
    NEW_EVENT_REMOVE_REACTION,
    NEW_EVENT_REACTION_UPDATED
  } = require('../../constants.json');
  const { getActiveUser, addReaction, removeReaction } = require('../utils/lib');
  
  module.exports = (socket) => {
    // Handler for adding reactions
    socket.on(
      NEW_EVENT_ADD_REACTION,
      async ({ messageId, chatId, emoji }, reactionAddedCallback) => {
        try {
          const user = getActiveUser({
            socketId: socket.id,
          });
  
          if (!user || !messageId || !chatId || !emoji) {
            reactionAddedCallback({ success: false });
            return;
          }
  
          // Rate limiting - could be enhanced with a proper rate limiter
          const lastReactionTime = user.lastReactionTime || 0;
          const now = Date.now();
          if (now - lastReactionTime < 500) { // 500ms cooldown between reactions
            reactionAddedCallback({ success: false, error: 'Too many reactions' });
            return;
          }
          user.lastReactionTime = now;
  
          // Validate emoji (basic validation)
          if (typeof emoji !== 'string' || emoji.length > 10) {
            reactionAddedCallback({ success: false, error: 'Invalid emoji' });
            return;
          }
  
          const reactionAdded = await addReaction(chatId, messageId, emoji, user.id);
  
          if (reactionAdded) {
            // Broadcast to other users in the chat
            socket.broadcast.to(chatId).emit(NEW_EVENT_REACTION_UPDATED, {
              messageId,
              chatId,
              emoji,
              userId: user.id,
              added: true
            });
          }
  
          reactionAddedCallback({ 
            success: reactionAdded,
            messageId,
            chatId,
            emoji,
            userId: user.id
          });
        } catch (error) {
          console.error('Error adding reaction:', error);
          reactionAddedCallback({ success: false, error: 'Server error' });
        }
      }
    );
  
    // Handler for removing reactions
    socket.on(
      NEW_EVENT_REMOVE_REACTION,
      async ({ messageId, chatId, emoji }, reactionRemovedCallback) => {
        try {
          const user = getActiveUser({
            socketId: socket.id,
          });
  
          if (!user || !messageId || !chatId || !emoji) {
            reactionRemovedCallback({ success: false });
            return;
          }
  
          const reactionRemoved = await removeReaction(chatId, messageId, emoji, user.id);
  
          if (reactionRemoved) {
            // Broadcast to other users in the chat
            socket.broadcast.to(chatId).emit(NEW_EVENT_REACTION_UPDATED, {
              messageId,
              chatId,
              emoji,
              userId: user.id,
              added: false
            });
          }
  
          reactionRemovedCallback({ 
            success: reactionRemoved,
            messageId,
            chatId,
            emoji,
            userId: user.id
          });
        } catch (error) {
          console.error('Error removing reaction:', error);
          reactionRemovedCallback({ success: false, error: 'Server error' });
        }
      }
    );
  };