const mongoose = require('mongoose');

const { model, Schema } = mongoose;

const MessageSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    containsBadword: {
      type: Boolean,
      default: false,
      required: true,
    },
    oldMessages: {
      type: Array,
    },
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      default: 'message',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    reactions: {
      type: Map,
      of: [String], // Array of user IDs who reacted with this emoji
      default: () => new Map()  // Using a function to return a new Map instance
    }
  },
  {
    timestamps: true,
    virtuals: {
      optimizedVersion: {
        get() {
          return {
            id: this._id.toString(),
            message: this.message,
            time: this.createdAt.getTime(),
            type: this.type,
            senderId: '', // This appears to be intentionally empty in your current code
            isEdited: this.isEdited,
            containsBadword: this.containsBadword,
            oldMessages: this.oldMessages,
            isRead: this.isRead,
            replyTo: this.replyTo?.toString() || null,
            reactions: this.reactions ? Object.fromEntries(this.reactions) : {} // Convert Map to plain object
          };
        },
      },
    },
  }
);

// Index for querying messages by reaction
// This creates an index on the reactions field keys
MessageSchema.index({ 'reactions.keys': 1 });

// Index for finding messages where a specific user has reacted
// This is a sparse index that only includes documents where the field exists
MessageSchema.index({ 'reactions.$**': 1 }, { sparse: true });

// Add validation for reactions
MessageSchema.path('reactions').validate(function(reactions) {
  if (!reactions) return true;
  
  // Check if all values are arrays
  for (const [emoji, userIds] of reactions.entries()) {
    if (!Array.isArray(userIds)) return false;
    
    // Check if all user IDs are strings
    if (!userIds.every(id => typeof id === 'string')) return false;
    
    // Optional: Validate emoji format if needed
    if (!/^(\p{Emoji}|\p{Emoji_Presentation}|\p{Emoji_Modifier}|\p{Emoji_Modifier_Base}|\p{Emoji_Component})$/u.test(emoji)) {
      return false;
    }
  }
  
  return true;
}, 'Invalid reactions format');


MessageSchema.methods = {
  ...MessageSchema.methods,
  
  /**
   * Add a reaction from a user
   * @param {string} emoji - The emoji to add
   * @param {string} userId - The user ID who reacted
   * @returns {Promise<boolean>} - Whether the reaction was added
   */
  async addReaction(emoji, userId) {
    // Get current reactions for this emoji
    const currentReactions = this.reactions.get(emoji) || [];
    
    // Don't add if user already reacted with this emoji
    if (currentReactions.includes(userId)) {
      return false;
    }
    
    // Add the reaction
    currentReactions.push(userId);
    this.reactions.set(emoji, currentReactions);
    
    // Save the document
    await this.save();
    return true;
  },
  
  /**
   * Remove a reaction from a user
   * @param {string} emoji - The emoji to remove
   * @param {string} userId - The user ID who reacted
   * @returns {Promise<boolean>} - Whether the reaction was removed
   */
  async removeReaction(emoji, userId) {
    // Get current reactions for this emoji
    const currentReactions = this.reactions.get(emoji);
    
    // If no reactions or user didn't react, return false
    if (!currentReactions || !currentReactions.includes(userId)) {
      return false;
    }
    
    // Remove the reaction
    const updatedReactions = currentReactions.filter(id => id !== userId);
    
    // If no reactions left, delete the emoji key
    if (updatedReactions.length === 0) {
      this.reactions.delete(emoji);
    } else {
      this.reactions.set(emoji, updatedReactions);
    }
    
    // Save the document
    await this.save();
    return true;
  },
  
  /**
   * Get all users who reacted with a specific emoji
   * @param {string} emoji - The emoji to check
   * @returns {Array<string>} - Array of user IDs
   */
  getUsersWhoReacted(emoji) {
    return this.reactions.get(emoji) || [];
  },
  
  /**
   * Check if a user reacted with a specific emoji
   * @param {string} emoji - The emoji to check
   * @param {string} userId - The user ID to check
   * @returns {boolean} - Whether the user reacted
   */
  hasUserReacted(emoji, userId) {
    const users = this.reactions.get(emoji);
    return users ? users.includes(userId) : false;
  }
};

// Static methods for the Message model
MessageSchema.statics = {
  ...MessageSchema.statics,
  
  /**
   * Find messages with a specific reaction
   * @param {string} emoji - The emoji to search for
   * @returns {Promise<Array>} - Messages with the reaction
   */
  async findByReaction(emoji) {
    return this.find({ [`reactions.${emoji}`]: { $exists: true } });
  },
  
  /**
   * Find messages where a specific user reacted
   * @param {string} userId - The user ID to search for
   * @returns {Promise<Array>} - Messages with reactions from the user
   */
  async findByUserReaction(userId) {
    return this.find({ 'reactions.$**': userId });
  }
};

module.exports = model('Message', MessageSchema);
