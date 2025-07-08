const ProfileCard = ({ profile, isCurrentUser = false, onConnect, onMessage, onViewProfile }) => {
  const {
    id,
    name,
    title,
    company,
    location,
    bio,
    skills = [],
    interests = [],
    avatar,
    connectionStatus,
    matchScore
  } = profile;

  const getConnectionButton = () => {
    if (isCurrentUser) return null;

    switch (connectionStatus) {
      case 'connected':
        return (
          <button
            onClick={() => onMessage(id)}
            className="btn-primary flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message
          </button>
        );
      case 'pending':
        return (
          <button className="btn-secondary flex-1" disabled>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending
          </button>
        );
      default:
        return (
          <button
            onClick={() => {
              if (typeof onConnect === 'function') {
                onConnect(id);
              } else {
                console.error("onConnect prop is not a function on ProfileCard");
              }
            }}
            className="btn-primary flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Connect
          </button>
        );
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      {/* Header with Match Score */}
      {matchScore && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">
              {matchScore}% Match
            </span>
          </div>
          <button
            onClick={() => onViewProfile(id)}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      )}

      {/* Avatar and Basic Info */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-600 truncate">{title}</p>
          {company && <p className="text-sm text-gray-500 truncate">{company}</p>}
          {location && (
            <div className="flex items-center mt-1">
              <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-gray-500 truncate">{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{bio}</p>
      )}

      {/* Skills - Only show if user has skills */}
      {skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md"
              >
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{skills.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Interests - Only show if user has interests */}
      {interests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {interests.slice(0, 3).map((interest, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md"
              >
                {interest}
              </span>
            ))}
            {interests.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{interests.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 pt-4 border-t border-gray-200">
        {getConnectionButton()}
        {!isCurrentUser && (
          <button
            onClick={() => onViewProfile(id)}
            className="btn-secondary px-4"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
