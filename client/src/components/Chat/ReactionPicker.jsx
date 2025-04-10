import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/reactions.css';

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const ReactionPicker = ({ onSelectReaction, onClose, isSender }) => {
  const handleReactionClick = (emoji) => {
    onSelectReaction(emoji);
    onClose();
  };

  return (
    <div className={`reaction-picker ${isSender ? 'message-sender' : 'message-receiver'}`}>
      {COMMON_REACTIONS.map((emoji) => (
        <div
          key={emoji}
          className="reaction-picker-emoji"
          onClick={() => handleReactionClick(emoji)}
          role="button"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
};

ReactionPicker.propTypes = {
  onSelectReaction: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isSender: PropTypes.bool.isRequired
};

export default ReactionPicker;