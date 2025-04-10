import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Whisper } from 'rsuite';
import '../../styles/reactions.css';

const MessageReactions = ({ reactions, onReactionClick, currentUserId }) => {
  if (!reactions || Object.keys(reactions).length === 0) {
    return null;
  }

  return (
    <div className="reactions-container">
      {Object.entries(reactions).map(([emoji, userIds]) => {
        const count = userIds.length;
        const hasReacted = userIds.includes(currentUserId);

        // Create tooltip content showing who reacted
        const tooltipContent = (
          <div>
            <p className="text-xs font-medium mb-1">Reacted with {emoji}:</p>
            <ul className="text-xs">
              {userIds.map((userId, index) => (
                <li key={userId}>
                  {userId === currentUserId ? 'You' : `User ${index + 1}`}
                </li>
              ))}
            </ul>
          </div>
        );

        return (
          <Whisper
            key={emoji}
            placement="top"
            trigger="hover"
            speaker={<Tooltip>{tooltipContent}</Tooltip>}
          >
            <div
              className={`reaction-bubble ${hasReacted ? 'active' : ''}`}
              onClick={() => onReactionClick(emoji)}
              role="button"
              aria-label={`${emoji} reaction with ${count} ${count === 1 ? 'person' : 'people'}`}
            >
              <span className="reaction-emoji">{emoji}</span>
              <span className="reaction-count">{count}</span>
            </div>
          </Whisper>
        );
      })}
    </div>
  );
};

MessageReactions.propTypes = {
  reactions: PropTypes.object,
  onReactionClick: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired
};

export default MessageReactions;