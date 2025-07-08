import { useState, useEffect } from 'react';
import { getAuthToken } from '../../utils/api'; // Ensure this utility is available

const ProfileForm = ({ initialData = {}, onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    profile: {
      firstName: initialData.profile?.firstName || '',
      lastName: initialData.profile?.lastName || '',
      professionalTitle: initialData.profile?.professionalTitle || '',
      company: initialData.profile?.company || '',
      location: {
        city: initialData.profile?.location?.city || '',
        country: initialData.profile?.location?.country || ''
      },
      bio: initialData.profile?.bio || '',
      linkedIn: initialData.profile?.linkedIn || '',
      website: initialData.profile?.website || ''
    },
    preferences: {
      skills: initialData.preferences?.skills || [],
      interests: initialData.preferences?.interests || [],
      networkingGoals: initialData.preferences?.networkingGoals || [],
      meetingPreferences: {
        format: initialData.preferences?.meetingPreferences?.format || 'both',
        duration: initialData.preferences?.meetingPreferences?.duration || '30min',
        timeZone: initialData.preferences?.meetingPreferences?.timeZone || 'UTC'
      }
    }
  });

  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  
  // Show more states for suggestions
  const [showMoreSkills, setShowMoreSkills] = useState(false);
  const [showMoreInterests, setShowMoreInterests] = useState(false);
  const [showMoreGoals, setShowMoreGoals] = useState(false);

  const handleInputChange = (section, field, value) => {
    if (section === 'profile' && field === 'location') {
      const [subField, subValue] = value;
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          location: {
            ...prev.profile.location,
            [subField]: subValue
          }
        }
      }));
    } else if (section === 'preferences' && field === 'meetingPreferences') {
      const [subField, subValue] = value;
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          meetingPreferences: {
            ...prev.preferences.meetingPreferences,
            [subField]: subValue
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.preferences.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          skills: [...prev.preferences.skills, skillInput.trim()]
        }
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        skills: prev.preferences.skills.filter(skill => skill !== skillToRemove)
      }
    }));
  };

  const addInterest = () => {
    if (interestInput.trim() && !formData.preferences.interests.includes(interestInput.trim())) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          interests: [...prev.preferences.interests, interestInput.trim()]
        }
      }));
      setInterestInput('');
    }
  };

  const removeInterest = (interestToRemove) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        interests: prev.preferences.interests.filter(interest => interest !== interestToRemove)
      }
    }));
  };

  const addGoal = () => {
    if (goalInput.trim() && !formData.preferences.networkingGoals.includes(goalInput.trim())) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          networkingGoals: [...prev.preferences.networkingGoals, goalInput.trim()]
        }
      }));
      setGoalInput('');
    }
  };

  const removeGoal = (goalToRemove) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        networkingGoals: prev.preferences.networkingGoals.filter(goal => goal !== goalToRemove)
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.profile.firstName}
              onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
              className="input-field"
              required
              autoComplete="given-name"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.profile.lastName}
              onChange={(e) => handleInputChange('profile', 'lastName', e.target.value)}
              className="input-field"
              required
              autoComplete="family-name"
            />
          </div>
          <div>
            <label htmlFor="professionalTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Professional Title *
            </label>
            <input
              type="text"
              id="professionalTitle"
              value={formData.profile.professionalTitle}
              onChange={(e) => handleInputChange('profile', 'professionalTitle', e.target.value)}
              className="input-field"
              placeholder="e.g. Software Engineer, Product Manager"
              required
            />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <input
              type="text"
              id="company"
              value={formData.profile.company}
              onChange={(e) => handleInputChange('profile', 'company', e.target.value)}
              className="input-field"
              autoComplete="organization"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              id="city"
              value={formData.profile.location.city}
              onChange={(e) => handleInputChange('profile', 'location', ['city', e.target.value])}
              className="input-field"
              placeholder="e.g. San Francisco"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={formData.profile.location.country}
              onChange={(e) => handleInputChange('profile', 'location', ['country', e.target.value])}
              className="input-field"
              placeholder="e.g. USA"
            />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            value={formData.profile.bio}
            onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
            className="input-field"
            placeholder="Tell us about yourself, your experience, and what you're passionate about..."
            maxLength={1000}
          />
          <div className="text-sm text-gray-500 mt-1">
            {formData.profile.bio.length}/1000 characters
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add your technical skills, expertise areas, and professional competencies
        </p>
        
        {/* Popular Skills Suggestions */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Popular Skills</p>
            {!showMoreSkills && (
              <button
                type="button"
                onClick={() => setShowMoreSkills(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                Show More
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'React', 'JavaScript', 'Python', 'Node.js', 'TypeScript', 'AWS', 
              'UI/UX Design', 'Project Management', 'Data Science', 'Machine Learning',
              'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'GraphQL', 'Vue.js',
              'Angular', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
              'Flutter', 'React Native', 'DevOps', 'CI/CD', 'Agile', 'Scrum',
              'Leadership', 'Product Management', 'Digital Marketing', 'SEO',
              'Content Strategy', 'Business Analysis', 'Blockchain', 'Cybersecurity'
            ]
            .filter(skill => !formData.preferences.skills.includes(skill))
            .slice(0, showMoreSkills ? undefined : 8)
            .map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      skills: [...prev.preferences.skills, skill]
                    }
                  }));
                }}
                className="suggestion-btn bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 border-gray-200 hover:border-blue-300"
              >
                + {skill}
              </button>
            ))}
          </div>
          {showMoreSkills && (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setShowMoreSkills(false)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center"
              >
                Show Less
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            id="add-skill"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            className="input-field flex-1"
            placeholder="Add a skill (e.g. React, Python, UI/UX Design, Project Management)"
          />
          <button
            type="button"
            onClick={addSkill}
            className="btn-primary px-4"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.preferences.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
        <p className="text-sm text-gray-600 mb-4">
          What topics, industries, or activities are you passionate about?
        </p>
        
        {/* Popular Interests Suggestions */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Popular Interests</p>
            {!showMoreInterests && (
              <button
                type="button"
                onClick={() => setShowMoreInterests(true)}
                className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center"
              >
                Show More
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Artificial Intelligence', 'Machine Learning', 'Blockchain', 'Cryptocurrency',
              'Startups', 'Entrepreneurship', 'Venture Capital', 'Fintech', 'Healthtech',
              'Climate Tech', 'Sustainability', 'Renewable Energy', 'IoT', 'Robotics',
              'Web3', 'NFTs', 'Gaming', 'EdTech', 'E-commerce', 'SaaS',
              'Mobile Development', 'Cloud Computing', 'Cybersecurity', 'Data Analytics',
              'Photography', 'Travel', 'Cooking', 'Fitness', 'Music', 'Art',
              'Reading', 'Writing', 'Podcasting', 'Public Speaking', 'Networking',
              'Mentoring', 'Open Source', 'Community Building', 'Social Impact'
            ]
            .filter(interest => !formData.preferences.interests.includes(interest))
            .slice(0, showMoreInterests ? undefined : 8)
            .map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      interests: [...prev.preferences.interests, interest]
                    }
                  }));
                }}
                className="suggestion-btn bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 border-gray-200 hover:border-green-300"
              >
                + {interest}
              </button>
            ))}
          </div>
          {showMoreInterests && (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setShowMoreInterests(false)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center"
              >
                Show Less
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            id="add-interest"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
            className="input-field flex-1"
            placeholder="Add an interest (e.g. AI/ML, Startups, Photography, Blockchain)"
          />
          <button
            type="button"
            onClick={addInterest}
            className="btn-primary px-4"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.preferences.interests.map((interest, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm rounded-md"
            >
              {interest}
              <button
                type="button"
                onClick={() => removeInterest(interest)}
                className="ml-2 text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Networking Goals */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Networking Goals</h3>
        <p className="text-sm text-gray-600 mb-4">
          What are you hoping to achieve through networking? This helps us match you with the right people.
        </p>
        
        {/* Popular Networking Goals Suggestions */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Common Networking Goals</p>
            {!showMoreGoals && (
              <button
                type="button"
                onClick={() => setShowMoreGoals(true)}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center"
              >
                Show More
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Find a Mentor', 'Become a Mentor', 'Job Opportunities', 'Career Transition',
              'Business Partnerships', 'Co-founder Search', 'Investment Opportunities',
              'Client Acquisition', 'Skill Development', 'Industry Insights',
              'Knowledge Sharing', 'Collaboration Projects', 'Speaking Opportunities',
              'Board Positions', 'Advisory Roles', 'Technical Discussions',
              'Product Feedback', 'Market Research', 'Talent Acquisition',
              'Vendor Partnerships', 'Strategic Alliances', 'Community Building'
            ]
            .filter(goal => !formData.preferences.networkingGoals.includes(goal))
            .slice(0, showMoreGoals ? undefined : 6)
            .map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      networkingGoals: [...prev.preferences.networkingGoals, goal]
                    }
                  }));
                }}
                className="suggestion-btn bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 border-gray-200 hover:border-purple-300"
              >
                + {goal}
              </button>
            ))}
          </div>
          {showMoreGoals && (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setShowMoreGoals(false)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center"
              >
                Show Less
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            id="add-goal"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
            className="input-field flex-1"
            placeholder="Add a networking goal (e.g. Find mentor, Job opportunities, Business partnerships)"
          />
          <button
            type="button"
            onClick={addGoal}
            className="btn-primary px-4"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.preferences.networkingGoals.map((goal, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-md"
            >
              {goal}
              <button
                type="button"
                onClick={() => removeGoal(goal)}
                className="ml-2 text-purple-500 hover:text-purple-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Meeting Preferences */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Format
            </label>
            <select
              id="format"
              value={formData.preferences.meetingPreferences.format}
              onChange={(e) => handleInputChange('preferences', 'meetingPreferences', ['format', e.target.value])}
              className="input-field"
            >
              <option value="both">Both Virtual & In-Person</option>
              <option value="virtual">Virtual Only</option>
              <option value="in-person">In-Person Only</option>
            </select>
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Duration
            </label>
            <select
              id="duration"
              value={formData.preferences.meetingPreferences.duration}
              onChange={(e) => handleInputChange('preferences', 'meetingPreferences', ['duration', e.target.value])}
              className="input-field"
            >
              <option value="15min">15 minutes</option>
              <option value="30min">30 minutes</option>
              <option value="45min">45 minutes</option>
              <option value="60min">60 minutes</option>
            </select>
          </div>
          <div>
            <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700 mb-2">
              Time Zone
            </label>
            <select
              id="timeZone"
              value={formData.preferences.meetingPreferences.timeZone}
              onChange={(e) => handleInputChange('preferences', 'meetingPreferences', ['timeZone', e.target.value])}
              className="timezone-select"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              
              {/* North America */}
              <optgroup label="🇺🇸 North America">
                <option value="America/New_York">Eastern Time (New York)</option>
                <option value="America/Chicago">Central Time (Chicago)</option>
                <option value="America/Denver">Mountain Time (Denver)</option>
                <option value="America/Los_Angeles">Pacific Time (Los Angeles)</option>
                <option value="America/Anchorage">Alaska Time (Anchorage)</option>
                <option value="Pacific/Honolulu">Hawaii Time (Honolulu)</option>
                <option value="America/Toronto">Eastern Time (Toronto)</option>
                <option value="America/Vancouver">Pacific Time (Vancouver)</option>
              </optgroup>

              {/* Europe */}
              <optgroup label="🇪🇺 Europe">
                <option value="Europe/London">GMT (London)</option>
                <option value="Europe/Paris">CET (Paris)</option>
                <option value="Europe/Berlin">CET (Berlin)</option>
                <option value="Europe/Madrid">CET (Madrid)</option>
                <option value="Europe/Rome">CET (Rome)</option>
                <option value="Europe/Amsterdam">CET (Amsterdam)</option>
                <option value="Europe/Stockholm">CET (Stockholm)</option>
                <option value="Europe/Moscow">MSK (Moscow)</option>
                <option value="Europe/Zurich">CET (Zurich)</option>
                <option value="Europe/Vienna">CET (Vienna)</option>
              </optgroup>

              {/* Asia */}
              <optgroup label="🌏 Asia">
                <option value="Asia/Tokyo">JST (Tokyo)</option>
                <option value="Asia/Shanghai">CST (Shanghai)</option>
                <option value="Asia/Hong_Kong">HKT (Hong Kong)</option>
                <option value="Asia/Singapore">SGT (Singapore)</option>
                <option value="Asia/Seoul">KST (Seoul)</option>
                <option value="Asia/Manila">PHT (Manila)</option>
                <option value="Asia/Bangkok">ICT (Bangkok)</option>
                <option value="Asia/Jakarta">WIB (Jakarta)</option>
                <option value="Asia/Kolkata">IST (India)</option>
                <option value="Asia/Dubai">GST (Dubai)</option>
                <option value="Asia/Karachi">PKT (Karachi)</option>
                <option value="Asia/Dhaka">BST (Dhaka)</option>
              </optgroup>

              {/* Australia & Oceania */}
              <optgroup label="🇦🇺 Australia & Oceania">
                <option value="Australia/Sydney">AEDT (Sydney)</option>
                <option value="Australia/Melbourne">AEDT (Melbourne)</option>
                <option value="Australia/Brisbane">AEST (Brisbane)</option>
                <option value="Australia/Perth">AWST (Perth)</option>
                <option value="Australia/Adelaide">ACDT (Adelaide)</option>
                <option value="Pacific/Auckland">NZDT (Auckland)</option>
                <option value="Pacific/Fiji">FJT (Fiji)</option>
              </optgroup>

              {/* South America */}
              <optgroup label="🌎 South America">
                <option value="America/Sao_Paulo">BRT (São Paulo)</option>
                <option value="America/Argentina/Buenos_Aires">ART (Buenos Aires)</option>
                <option value="America/Lima">PET (Lima)</option>
                <option value="America/Santiago">CLT (Santiago)</option>
                <option value="America/Bogota">COT (Bogotá)</option>
                <option value="America/Caracas">VET (Caracas)</option>
              </optgroup>

              {/* Africa */}
              <optgroup label="🌍 Africa">
                <option value="Africa/Lagos">WAT (Lagos)</option>
                <option value="Africa/Cairo">EET (Cairo)</option>
                <option value="Africa/Johannesburg">SAST (Johannesburg)</option>
                <option value="Africa/Nairobi">EAT (Nairobi)</option>
                <option value="Africa/Casablanca">WET (Casablanca)</option>
                <option value="Africa/Tunis">CET (Tunis)</option>
              </optgroup>

              {/* Middle East */}
              <optgroup label="🕌 Middle East">
                <option value="Asia/Jerusalem">IST (Jerusalem)</option>
                <option value="Asia/Beirut">EET (Beirut)</option>
                <option value="Asia/Tehran">IRST (Tehran)</option>
                <option value="Asia/Riyadh">AST (Riyadh)</option>
                <option value="Asia/Kuwait">AST (Kuwait)</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Links</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="linkedIn" className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn URL
            </label>
            <input
              type="url"
              id="linkedIn"
              value={formData.profile.linkedIn}
              onChange={(e) => handleInputChange('profile', 'linkedIn', e.target.value)}
              className="input-field"
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              Website/Portfolio
            </label>
            <input
              type="url"
              id="website"
              value={formData.profile.website}
              onChange={(e) => handleInputChange('profile', 'website', e.target.value)}
              className="input-field"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary min-w-[120px]"
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
