

const MatchCard = ({ match, onConnect, onViewProfile, onMessage }) => {
  const {
    profile,
    matchScore,
    compatibilityReasons,
    mutualConnections,
    sharedInterests,
    sharedSkills
  } = match;

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getMatchScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Potential Match';
  };

  return (
    <div className="card hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary-500">
      {/* Match Score Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchScoreColor(matchScore)}`}>
            {matchScore}% Match
          </div>
          <span className="text-sm text-gray-600">{getMatchScoreLabel(matchScore)}</span>
        </div>
        <div className="flex items-center space-x-2">
          {mutualConnections > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              {mutualConnections}
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{profile.name}</h3>
          <p className="text-sm text-gray-600 mb-1">{profile.title}</p>
          {profile.company && <p className="text-sm text-gray-500 mb-2">{profile.company}</p>}
          {profile.location && (
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-gray-500">{profile.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Compatibility Reasons */}
      {compatibilityReasons && compatibilityReasons.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Why you might connect:</h4>
          <ul className="space-y-1">
            {compatibilityReasons.slice(0, 3).map((reason, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <svg className="w-3 h-3 text-green-500 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Shared Interests & Skills */}
      <div className="space-y-3 mb-6">
        {sharedInterests && sharedInterests.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Shared Interests ({sharedInterests.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {sharedInterests.slice(0, 4).map((interest, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md border border-green-200"
                >
                  {interest}
                </span>
              ))}
              {sharedInterests.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                  +{sharedInterests.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {sharedSkills && sharedSkills.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Shared Skills ({sharedSkills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {sharedSkills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md border border-blue-200"
                >
                  {skill}
                </span>
              ))}
              {sharedSkills.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                  +{sharedSkills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => onConnect(profile.id)}
          className="btn-primary flex-1"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Connect
        </button>
        <button
          onClick={() => onMessage(profile.id)}
          className="btn-secondary flex-1"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message
        </button>
        <button
          onClick={() => onViewProfile(profile.id)}
          className="btn-secondary px-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MatchCard;
