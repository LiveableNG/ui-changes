import React, { useState } from 'react';
import { Trash2, Copy, ChevronDown, ChevronRight, ChevronLeft, Plus, Settings, Eye, EyeOff, ArrowRight } from 'lucide-react';

const PreviewMode = ({ formData, formResponses, setFormResponses, setSubmittedData }) => {
    const [navigationHistory, setNavigationHistory] = useState([0]);
    const [currentSection, setCurrentSection] = useState(0);

    const getNextSection = () => {
        const currentSectionData = formData.sections[currentSection];

        // Check for question-based navigation rules first
        for (const question of currentSectionData.questions) {
            if (question.sectionNavigation?.enabled && question.sectionNavigation.rules.length > 0) {
                const response = formResponses[question.id];
                const matchingRule = question.sectionNavigation.rules.find(rule => rule.value === response);

                if (matchingRule) {
                    if (matchingRule.goToSection === 'submit') {
                        return 'submit';
                    }
                    return formData.sections.findIndex(s => s.id === matchingRule.goToSection);
                }
            }
        }

        // Check for default section navigation
        if (currentSectionData.nextSection) {
            if (currentSectionData.nextSection === 'submit') {
                return 'submit';
            }
            return formData.sections.findIndex(s => s.id === currentSectionData.nextSection);
        }

        // Default to next section
        return currentSection + 1;
    };

    // Modified handleNext to update navigation history
    const handleNext = () => {
        const nextSection = getNextSection();
        if (nextSection === 'submit') {
            handleSubmit();
        } else if (nextSection < formData.sections.length) {
            setNavigationHistory(prev => [...prev, nextSection]);
            setCurrentSection(nextSection);
        }
    };

    // Modified handlePrevious to use navigation history
    const handlePrevious = () => {
        if (navigationHistory.length > 1) {
            const newHistory = [...navigationHistory];
            newHistory.pop(); // Remove current section
            const previousSection = newHistory[newHistory.length - 1];
            setNavigationHistory(newHistory);
            setCurrentSection(previousSection);
        }
    };

    const handleSubmit = () => {
        setSubmittedData({
            responses: formResponses,
            submittedAt: new Date().toISOString()
        });
    };

    const handleInputChange = (questionId, value) => {
        setFormResponses(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const evaluateCondition = (condition) => {
        if (!condition) return true;
        const { type, questionId, value } = condition;
        const response = formResponses[questionId];

        switch (type) {
            case 'equals': return response === value;
            case 'not_equals': return response !== value;
            case 'empty': return !response;
            case 'not_empty': return !!response;
            default: return true;
        }
    };

    const renderQuestion = (question) => {
        if (!evaluateCondition(question.conditions.visible_if)) return null;

        const isRequired = question.required ||
            (question.conditions.required_if && evaluateCondition(question.conditions.required_if));

        return (
            <div key={question.id} className="mb-6">
                <label className="block font-medium mb-2">
                    {question.title}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                {question.description && (
                    <p className="text-sm text-gray-500 mb-2">{question.description}</p>
                )}

                {question.type === 'short' && (
                    <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={formResponses[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        disabled={question.disabled}
                        readOnly={question.readonly}
                    />
                )}
                {question.type === 'long' && (
                    <textarea
                        className="w-full border rounded-lg p-2 min-h-[100px]"
                        value={formResponses[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        disabled={question.disabled}
                        readOnly={question.readonly}
                    />
                )}
                {question.type === 'radio' && (
                    <div className="space-y-2">
                        {question.options.map((option, index) => (
                            <label key={index} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name={`question_${question.id}`}
                                    value={option}
                                    checked={formResponses[question.id] === option}
                                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                                    disabled={question.disabled}
                                    className="border-gray-300 text-blue-500 focus:ring-blue-500"
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                )}
                {question.type === 'checkbox' && (
                    <div className="space-y-2">
                        {question.options.map((option, index) => (
                            <label key={index} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    value={option}
                                    checked={Array.isArray(formResponses[question.id]) && formResponses[question.id].includes(option)}
                                    onChange={(e) => {
                                        const currentValues = Array.isArray(formResponses[question.id])
                                            ? formResponses[question.id]
                                            : [];
                                        const newValues = e.target.checked
                                            ? [...currentValues, option]
                                            : currentValues.filter(v => v !== option);
                                        handleInputChange(question.id, newValues);
                                    }}
                                    disabled={question.disabled}
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                )}
                {question.type === 'dropdown' && (
                    <select
                        className="w-full border rounded-lg p-2"
                        value={formResponses[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        disabled={question.disabled}
                    >
                        <option value="">Select an option</option>
                        {question.options.map((option, index) => (
                            <option key={index} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                )}
                {question.type === 'file' && (
                    <input
                        type="file"
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleInputChange(question.id, file ? file.name : '');
                        }}
                        disabled={question.disabled}
                    />
                )}
                {question.type === 'date' && (
                    <input
                        type="date"
                        className="w-full border rounded-lg p-2"
                        value={formResponses[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        disabled={question.disabled}
                        readOnly={question.readonly}
                    />
                )}
                {question.type === 'time' && (
                    <input
                        type="time"
                        className="w-full border rounded-lg p-2"
                        value={formResponses[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        disabled={question.disabled}
                        readOnly={question.readonly}
                    />
                )}
            </div>
        );
    };

    const currentSectionData = formData.sections[currentSection];

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Progress indicator */}
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                <span>Section {currentSection + 1} of {formData.sections.length}:</span>
                <span className="font-medium">{currentSectionData.title}</span>
            </div>

            <h2 className="text-xl font-semibold mb-4">{currentSectionData.title}</h2>
            {currentSectionData.description && (
                <p className="text-gray-600 mb-6">{currentSectionData.description}</p>
            )}

            {currentSectionData.questions.map(renderQuestion)}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
                <div>
                    {navigationHistory.length > 1 && (
                        <button
                            onClick={handlePrevious}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg inline-flex items-center gap-2"
                        >
                            <ChevronLeft size={16} />
                            Previous: {formData.sections[navigationHistory[navigationHistory.length - 2]]?.title}
                        </button>
                    )}
                </div>
                <div>
                    {currentSection < formData.sections.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-flex items-center gap-2"
                        >
                            {getNextSection() === 'submit' ? (
                                'Submit'
                            ) : (
                                <>
                                    Next: {formData.sections[getNextSection()]?.title}
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Submit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const GoogleLikeFormBuilder = () => {
    const [formData, setFormData] = useState({
        "title": "Untitled Form",
        "description": "",
        "sections": [
            {
                "id": "1",
                "title": "Personal Information",
                "description": "",
                "isCollapsed": false,
                "nextSection": null,
                "questions": [
                    {
                        "id": 1732617992285,
                        "type": "radio",
                        "title": "Type of tenant",
                        "key": "type_of_tenant",
                        "description": "",
                        "placeholder": "",
                        "required": true,
                        "disabled": false,
                        "visible": true,
                        "readonly": false,
                        "conditions": {
                            "required_if": null,
                            "visible_if": null
                        },
                        "options": [
                            "Individual",
                            "Corporate"
                        ],
                        "sectionNavigation": {
                            "enabled": false,
                            "rules": []
                        }
                    },
                    {
                        "id": 1732618028233,
                        "type": "short",
                        "title": "First Name",
                        "key": "first_name",
                        "description": "",
                        "placeholder": "Enter your first name",
                        "required": false,
                        "disabled": false,
                        "visible": true,
                        "readonly": false,
                        "conditions": {
                            "required_if": {
                                "type": "equals",
                                "questionId": "1732617992285",
                                "value": "Individual"
                            },
                            "visible_if": {
                                "type": "equals",
                                "questionId": "1732617992285",
                                "value": "Individual"
                            }
                        },
                        "options": [],
                        "sectionNavigation": {
                            "enabled": false,
                            "rules": []
                        }
                    },
                    {
                        "id": 1732618031862,
                        "type": "short",
                        "title": "Last Name",
                        "key": "last_name",
                        "description": "",
                        "placeholder": "Enter your last name",
                        "required": false,
                        "disabled": false,
                        "visible": true,
                        "readonly": false,
                        "conditions": {
                            "required_if": {
                                "type": "equals",
                                "questionId": "1732617992285",
                                "value": "Individual"
                            },
                            "visible_if": {
                                "type": "equals",
                                "questionId": "1732617992285",
                                "value": "Individual"
                            }
                        },
                        "options": [],
                        "sectionNavigation": {
                            "enabled": false,
                            "rules": []
                        }
                    },
                    {
                        "id": 1732618033947,
                        "type": "short",
                        "title": "Corporate Name",
                        "key": "corporate_name",
                        "description": "",
                        "placeholder": "Enter your corporate name",
                        "required": true,
                        "disabled": false,
                        "visible": true,
                        "readonly": false,
                        "conditions": {
                            "required_if": {
                                "type": "equals",
                                "questionId": "1732617992285",
                                "value": ""
                            },
                            "visible_if": {
                                "type": "equals",
                                "questionId": "1732617992285",
                                "value": ""
                            }
                        },
                        "options": [],
                        "sectionNavigation": {
                            "enabled": false,
                            "rules": []
                        }
                    },
                    {
                        "id": 1732618315136,
                        "type": "short",
                        "title": "Email",
                        "key": "email",
                        "description": "",
                        "placeholder": "Enter your email address",
                        "required": true,
                        "disabled": false,
                        "visible": true,
                        "readonly": false,
                        "conditions": {
                            "required_if": null,
                            "visible_if": null
                        },
                        "options": [],
                        "sectionNavigation": {
                            "enabled": false,
                            "rules": []
                        }
                    },
                    {
                        "id": 1732618381734,
                        "type": "short",
                        "title": "Phone",
                        "key": "phone",
                        "description": "",
                        "placeholder": "Enter your phone number",
                        "required": true,
                        "disabled": false,
                        "visible": true,
                        "readonly": false,
                        "conditions": {
                            "required_if": {
                                "type": "equals",
                                "questionId": "",
                                "value": null
                            },
                            "visible_if": null
                        },
                        "options": [],
                        "sectionNavigation": {
                            "enabled": false,
                            "rules": []
                        }
                    },
                    {
                        "id": 1732618701511,
                        "type": "radio",
                        "title": "Work type",
                        "key": "",
                        "description": "",
                        "placeholder": "",
                        "required": true,
                        "disabled": false,
                        "visible": true,
                        "readonly": false,
                        "conditions": {
                            "required_if": null,
                            "visible_if": null
                        },
                        "options": [
                            "Employee",
                            "Self Employed"
                        ],
                        "sectionNavigation": {
                            "enabled": true,
                            "rules": [
                                {
                                    "value": "Employee",
                                    "goToSection": "2"
                                },
                                {
                                    "value": "Self Employed",
                                    "goToSection": "3"
                                }
                            ]
                        }
                    }
                ]
            },
            {
                "id": "2",
                "title": "Employee Information",
                "description": "",
                "isCollapsed": false,
                "nextSection": "submit",
                "questions": [
                    {
                        "id": 1732618687663,
                        "type": "short",
                        "title": "Untitled Question",
                        "key": "",
                        "description": "",
                        "placeholder": "",
                        "required": false,
                        "disabled": false,
                        "visible": true,
                        "readonly": false,
                        "conditions": {
                            "required_if": null,
                            "visible_if": null
                        },
                        "options": [],
                        "sectionNavigation": {
                            "enabled": false,
                            "rules": []
                        }
                    }
                ]
            },
            {
                "id": "3",
                "title": "Self-employed Information",
                "description": "",
                "isCollapsed": false,
                "nextSection": null,
                "questions": [
                    {
                        "id": 1732618689259,
                        "type": "short",
                        "title": "Untitled Question",
                        "key": "",
                        "description": "",
                        "placeholder": "",
                        "required": false,
                        "disabled": false,
                        "visible": true,
                        "readonly": false,
                        "conditions": {
                            "required_if": null,
                            "visible_if": null
                        },
                        "options": [],
                        "sectionNavigation": {
                            "enabled": false,
                            "rules": []
                        }
                    }
                ]
            }
        ]
    });
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // Preview states
    const [isPreview, setIsPreview] = useState(false);
    const [formResponses, setFormResponses] = useState({});
    const [submittedData, setSubmittedData] = useState(null);

    const questionTypes = [
        { id: 'short', label: 'Short Answer' },
        { id: 'long', label: 'Paragraph' },
        { id: 'radio', label: 'Multiple Choice' },
        { id: 'checkbox', label: 'Checkboxes' },
        { id: 'dropdown', label: 'Dropdown' },
        { id: 'file', label: 'File Upload' },
        { id: 'date', label: 'Date' },
        { id: 'time', label: 'Time' }
    ];

    const questionSuggestions = {
        short: [
            { label: 'First Name', key: 'first_name', placeholder: 'Enter your first name' },
            { label: 'Last Name', key: 'last_name', placeholder: 'Enter your last name' },
            { label: 'Corporate Name', key: 'corporate_name', placeholder: 'Enter your corporate name' },
            { label: 'Email', key: 'email', placeholder: 'Enter your email address' },
            { label: 'Work Email', key: 'work_email', placeholder: 'Enter your work email address' },
            { label: 'Phone', key: 'phone', placeholder: 'Enter your phone number' },
            { label: 'Company', key: 'company', placeholder: 'Enter your company name' }
        ],
        long: [
            { label: 'Address', key: 'address', placeholder: 'Enter your full address' },
            { label: 'Bio', key: 'bio', placeholder: 'Tell us about yourself' },
            { label: 'Comments', key: 'comments', placeholder: 'Enter your comments' },
            { label: 'Feedback', key: 'feedback', placeholder: 'Provide your feedback' }
        ],
        radio: [
            {
                label: 'Type of tenant',
                key: 'type_of_tenant',
                options: ['Individual', 'Corporate']
            },
            {
                label: 'Gender',
                key: 'gender',
                options: ['Male', 'Female', 'Other', 'Prefer not to say']
            },
            {
                label: 'Age Range',
                key: 'age_range',
                options: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55+']
            },
            {
                label: 'Experience Level',
                key: 'experience',
                options: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
            }
        ],
        checkbox: [
            {
                label: 'Interests',
                key: 'interests',
                options: ['Technology', 'Sports', 'Music', 'Travel', 'Food', 'Art']
            },
            {
                label: 'Skills',
                key: 'skills',
                options: ['Programming', 'Design', 'Marketing', 'Management', 'Sales']
            }
        ],
        dropdown: [
            {
                label: 'Country',
                key: 'country',
                options: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Other']
            },
            {
                label: 'Language',
                key: 'language',
                options: ['English', 'Spanish', 'French', 'German', 'Chinese']
            }
        ]
    };

    const hasTemplates = (type) => {
        return questionSuggestions[type] && questionSuggestions[type].length > 0;
    };

    const addSection = () => {
        const newSection = {
            id: String(formData.sections.length + 1),
            title: `Section ${formData.sections.length + 1}`,
            description: '',
            isCollapsed: false,
            nextSection: null,
            questions: []
        };
        setFormData({
            ...formData,
            sections: [...formData.sections, newSection]
        });
    };

    const addQuestion = (sectionId) => {
        const newQuestion = {
            id: Date.now(),
            type: 'short',
            title: 'Untitled Question',
            key: '',
            description: '',
            placeholder: '',
            required: false,
            disabled: false,
            visible: true,
            readonly: false,
            conditions: {
                required_if: null,
                visible_if: null
            },
            options: [],
            sectionNavigation: {
                enabled: false,
                rules: []
            }
        };

        setFormData({
            ...formData,
            sections: formData.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        questions: [...section.questions, newQuestion]
                    };
                }
                return section;
            })
        });
    };

    const toggleQuestionSetting = (sectionId, questionId, setting) => {
        setFormData({
            ...formData,
            sections: formData.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        questions: section.questions.map(question => {
                            if (question.id === questionId) {
                                return {
                                    ...question,
                                    [setting]: !question[setting]
                                };
                            }
                            return question;
                        })
                    };
                }
                return section;
            })
        });
    };

    const updateSectionNavigation = (sectionId, questionId, rules) => {
        setFormData({
            ...formData,
            sections: formData.sections.map(section => {
                if (section.id === section.id) {
                    return {
                        ...section,
                        questions: section.questions.map(question => {
                            if (question.id === questionId) {
                                return {
                                    ...question,
                                    sectionNavigation: {
                                        ...question.sectionNavigation,
                                        ...rules
                                    }
                                };
                            }
                            return question;
                        })
                    };
                }
                return section;
            })
        });
    };

    const updateQuestionCondition = (sectionId, questionId, conditionType, condition) => {
        setFormData({
            ...formData,
            sections: formData.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        questions: section.questions.map(question => {
                            if (question.id === questionId) {
                                return {
                                    ...question,
                                    conditions: {
                                        ...question.conditions,
                                        [conditionType]: condition
                                    }
                                };
                            }
                            return question;
                        })
                    };
                }
                return section;
            })
        });
    };

    const deleteQuestion = (sectionId, questionId) => {
        setFormData({
            ...formData,
            sections: formData.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        questions: section.questions.filter(q => q.id !== questionId)
                    };
                }
                return section;
            })
        });
    };

    const duplicateQuestion = (sectionId, questionId) => {
        const section = formData.sections.find(s => s.id === sectionId);
        const question = section.questions.find(q => q.id === questionId);
        const newQuestion = {
            ...question,
            id: Date.now()
        };

        setFormData({
            ...formData,
            sections: formData.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        questions: [...section.questions, newQuestion]
                    };
                }
                return section;
            })
        });
    };

    const toggleSectionCollapse = (sectionId) => {
        setFormData({
            ...formData,
            sections: formData.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        isCollapsed: !section.isCollapsed
                    };
                }
                return section;
            })
        });
    };

    const deleteSection = (sectionId) => {
        setFormData({
            ...formData,
            sections: formData.sections.filter(section => section.id !== sectionId)
        });
    };

    const updateQuestionType = (sectionId, questionId, newType) => {
        setFormData({
            ...formData,
            sections: formData.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        questions: section.questions.map(question => {
                            if (question.id === questionId) {
                                return {
                                    ...question,
                                    type: newType,
                                    options: newType === 'radio' || newType === 'checkbox' || newType === 'dropdown' ? ['Option 1'] : []
                                };
                            }
                            return question;
                        })
                    };
                }
                return section;
            })
        });
    };

    // Add this helper function for type-specific description placeholders
    const getDescriptionPlaceholder = (type) => {
        const placeholders = {
            short: 'Enter a brief help text for this short answer question',
            long: 'Provide guidance for this paragraph response',
            radio: 'Explain how to choose between these options',
            checkbox: 'Describe how many options can be selected',
            dropdown: 'Help text for selecting from the dropdown',
            file: 'Specify allowed file types or size limits',
            date: 'Explain the expected date format or range',
            time: 'Specify time format or restrictions'
        };
        return placeholders[type] || 'Add help text for this question';
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Preview */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => {
                        setIsPreview(!isPreview);
                        setFormResponses({});
                        setSubmittedData(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
                >
                    {isPreview ? (
                        <>
                            <EyeOff size={16} />
                            Exit Preview
                        </>
                    ) : (
                        <>
                            <Eye size={16} />
                            Preview Form
                        </>
                    )}
                </button>
            </div>

            {/* Sections */}
            {isPreview ? (
                <PreviewMode
                    formData={formData}
                    formResponses={formResponses}
                    setFormResponses={setFormResponses}
                    setSubmittedData={setSubmittedData}
                />
            ) : (
                <>
                    {/* Form Header */}
                    <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
                        <input
                            className="w-full text-3xl font-bold mb-2 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <input
                            className="w-full text-gray-600 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                            value={formData.description}
                            placeholder="Form description"
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    {formData.sections.map((section) => (
                        <div key={section.id} className="bg-white rounded-lg shadow-sm mb-6">
                            {/* Section Header */}
                            <div className="p-6 border-b">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleSectionCollapse(section.id)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        {section.isCollapsed ? <ChevronRight /> : <ChevronDown />}
                                    </button>
                                    <input
                                        className="flex-1 text-xl font-semibold border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                                        value={section.title}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                sections: formData.sections.map(s =>
                                                    s.id === section.id ? { ...s, title: e.target.value } : s
                                                )
                                            });
                                        }}
                                    />
                                    <button
                                        onClick={() => deleteSection(section.id)}
                                        className="text-gray-500 hover:text-red-500"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Section Content */}
                            {!section.isCollapsed && (
                                <div className="p-6">
                                    {/* Questions */}
                                    {section.questions.map((question) => (
                                        <div
                                            key={question.id}
                                            className={`mb-6 p-4 border rounded-lg hover:border-blue-500 ${!question.visible ? 'opacity-50' : ''
                                                }`}
                                        >
                                            {/* Question Header */}
                                            <div className="flex items-center gap-4 mb-2">
                                                <select
                                                    className="border rounded px-2 py-1"
                                                    value={question.type}
                                                    onChange={(e) => updateQuestionType(section.id, question.id, e.target.value)}
                                                >
                                                    {questionTypes.map(type => (
                                                        <option key={type.id} value={type.id}>{type.label}</option>
                                                    ))}
                                                </select>
                                                {hasTemplates(question.type) && (
                                                    <select
                                                        className="border rounded px-2 py-1 text-sm"
                                                        value=""
                                                        onChange={(e) => {
                                                            const suggestion = questionSuggestions[question.type]?.find(
                                                                s => s.key === e.target.value
                                                            );
                                                            if (suggestion) {
                                                                setFormData({
                                                                    ...formData,
                                                                    sections: formData.sections.map(s =>
                                                                        s.id === section.id ? {
                                                                            ...s,
                                                                            questions: s.questions.map(q =>
                                                                                q.id === question.id ? {
                                                                                    ...q,
                                                                                    title: suggestion.label,
                                                                                    key: suggestion.key,
                                                                                    placeholder: suggestion.placeholder || '',
                                                                                    options: suggestion.options || q.options
                                                                                } : q
                                                                            )
                                                                        } : s
                                                                    )
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Select a template</option>
                                                        {questionSuggestions[question.type]?.map(suggestion => (
                                                            <option key={suggestion.key} value={suggestion.key}>
                                                                {suggestion.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                <input
                                                    className="flex-1 font-medium border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                                                    value={question.title}
                                                    onChange={(e) => {
                                                        setFormData({
                                                            ...formData,
                                                            sections: formData.sections.map(s =>
                                                                s.id === section.id ? {
                                                                    ...s,
                                                                    questions: s.questions.map(q =>
                                                                        q.id === question.id ? { ...q, title: e.target.value } : q
                                                                    )
                                                                } : s
                                                            )
                                                        });
                                                    }}
                                                />
                                                {question.description && (
                                                    <div className="mt-1 text-sm text-gray-500">
                                                        {question.description}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => duplicateQuestion(section.id, question.id)}
                                                    className="text-gray-500 hover:text-blue-500"
                                                >
                                                    <Copy size={20} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedQuestion(question.id === selectedQuestion ? null : question.id)}
                                                    className={`text-gray-500 hover:text-blue-500 ${selectedQuestion === question.id ? 'text-blue-500' : ''
                                                        }`}
                                                >
                                                    <Settings size={20} />
                                                </button>
                                                <button
                                                    onClick={() => deleteQuestion(section.id, question.id)}
                                                    className="text-gray-500 hover:text-red-500"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>

                                            {/* Advanced Settings Panel */}
                                            {selectedQuestion === question.id && (
                                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                    <div className="space-y-4">
                                                        {/* Basic Settings */}
                                                        <div className="flex flex-wrap gap-4">
                                                            <label className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={question.required}
                                                                    onChange={() => toggleQuestionSetting(section.id, question.id, 'required')}
                                                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm">Required</span>
                                                            </label>
                                                            <label className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={question.readonly}
                                                                    onChange={() => toggleQuestionSetting(section.id, question.id, 'readonly')}
                                                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm">Read Only</span>
                                                            </label>
                                                            <label className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={question.disabled}
                                                                    onChange={() => toggleQuestionSetting(section.id, question.id, 'disabled')}
                                                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm">Disabled</span>
                                                            </label>
                                                            <label className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={question.visible}
                                                                    onChange={() => toggleQuestionSetting(section.id, question.id, 'visible')}
                                                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm">Visible</span>
                                                            </label>
                                                        </div>

                                                        <div className="mt-4">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Description/Help Text
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="w-full border rounded-lg p-2 text-sm"
                                                                placeholder={getDescriptionPlaceholder(question.type)}
                                                                value={question.description || ''}
                                                                onChange={(e) => {
                                                                    setFormData({
                                                                        ...formData,
                                                                        sections: formData.sections.map(s =>
                                                                            s.id === section.id ? {
                                                                                ...s,
                                                                                questions: s.questions.map(q =>
                                                                                    q.id === question.id ? {
                                                                                        ...q,
                                                                                        description: e.target.value
                                                                                    } : q
                                                                                )
                                                                            } : s
                                                                        )
                                                                    });
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Conditional Logic */}
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium text-sm">Conditions</h4>

                                                            {/* Required If */}
                                                            <div className="flex items-center gap-2">
                                                                <label className="text-sm min-w-[100px]">Required if:</label>
                                                                <select
                                                                    className="text-sm border rounded px-2 py-1 flex-1"
                                                                    value={question.conditions.required_if?.type || ''}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        updateQuestionCondition(section.id, question.id, 'required_if',
                                                                            value ? { type: value, questionId: null, value: null } : null
                                                                        );
                                                                    }}
                                                                >
                                                                    <option value="">No condition</option>
                                                                    <option value="equals">Equals</option>
                                                                    <option value="not_equals">Not Equals</option>
                                                                    <option value="empty">Empty</option>
                                                                    <option value="not_empty">Not Empty</option>
                                                                </select>

                                                                {question.conditions.required_if && (
                                                                    <>
                                                                        <select
                                                                            className="text-sm border rounded px-2 py-1"
                                                                            value={question.conditions.required_if.questionId || ''}
                                                                            onChange={(e) => {
                                                                                updateQuestionCondition(section.id, question.id, 'required_if', {
                                                                                    ...question.conditions.required_if,
                                                                                    questionId: e.target.value
                                                                                });
                                                                            }}
                                                                        >
                                                                            <option value="">Select question</option>
                                                                            {formData.sections.map(sect => (
                                                                                <optgroup key={sect.id} label={sect.title}>
                                                                                    {sect.questions
                                                                                        .filter(q => q.id !== question.id)
                                                                                        .map(q => (
                                                                                            <option key={q.id} value={q.id}>{q.title}</option>
                                                                                        ))
                                                                                    }
                                                                                </optgroup>
                                                                            ))}
                                                                        </select>

                                                                        {['equals', 'not_equals'].includes(question.conditions.required_if?.type) && (
                                                                            <>
                                                                                {/* Find selected question's options */}
                                                                                {(() => {
                                                                                    const selectedQuestion = question.conditions.required_if?.questionId ?
                                                                                        formData.sections.flatMap(s => s.questions).find(q => q.id === question.conditions.required_if.questionId)
                                                                                        : null;
                                                                                    const hasOptions = selectedQuestion?.options?.length > 0;
                                                                                    console.log({hasOptions, selectedQuestion})

                                                                                    return (
                                                                                        <div className="flex-1">
                                                                                            <input
                                                                                                type="text"
                                                                                                list={hasOptions ? `options-${question.id}-required` : undefined}
                                                                                                className="w-full text-sm border rounded px-2 py-1"
                                                                                                placeholder="Value"
                                                                                                value={question.conditions.required_if.value || ''}
                                                                                                onChange={(e) => {
                                                                                                    updateQuestionCondition(section.id, question.id, 'required_if', {
                                                                                                        ...question.conditions.required_if,
                                                                                                        value: e.target.value
                                                                                                    });
                                                                                                }}
                                                                                            />
                                                                                            {hasOptions && (
                                                                                                <datalist id={`options-${question.id}-required`}>
                                                                                                    {selectedQuestion.options.map((option, index) => (
                                                                                                        <option key={index} value={option} />
                                                                                                    ))}
                                                                                                </datalist>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Visible If */}
                                                            <div className="flex items-center gap-2">
                                                                <label className="text-sm min-w-[100px]">Visible if:</label>
                                                                <select
                                                                    className="text-sm border rounded px-2 py-1 flex-1"
                                                                    value={question.conditions.visible_if?.type || ''}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        updateQuestionCondition(section.id, question.id, 'visible_if',
                                                                            value ? { type: value, questionId: null, value: null } : null
                                                                        );
                                                                    }}
                                                                >
                                                                    <option value="">No condition</option>
                                                                    <option value="equals">Equals</option>
                                                                    <option value="not_equals">Not Equals</option>
                                                                    <option value="empty">Empty</option>
                                                                    <option value="not_empty">Not Empty</option>
                                                                </select>

                                                                {question.conditions.visible_if && (
                                                                    <>
                                                                        <select
                                                                            className="text-sm border rounded px-2 py-1"
                                                                            value={question.conditions.visible_if.questionId || ''}
                                                                            onChange={(e) => {
                                                                                updateQuestionCondition(section.id, question.id, 'visible_if', {
                                                                                    ...question.conditions.visible_if,
                                                                                    questionId: e.target.value
                                                                                });
                                                                            }}
                                                                        >
                                                                            <option value="">Select question</option>
                                                                            {formData.sections.map(sect => (
                                                                                <optgroup key={sect.id} label={sect.title}>
                                                                                    {sect.questions
                                                                                        .filter(q => q.id !== question.id)
                                                                                        .map(q => (
                                                                                            <option key={q.id} value={q.id}>{q.title}</option>
                                                                                        ))
                                                                                    }
                                                                                </optgroup>
                                                                            ))}
                                                                        </select>

                                                                        {['equals', 'not_equals'].includes(question.conditions.visible_if?.type) && (
                                                                            <>
                                                                                {(() => {
                                                                                    const selectedQuestion = question.conditions.visible_if?.questionId ?
                                                                                        formData.sections.flatMap(s => s.questions).find(q => q.id === question.conditions.visible_if.questionId)
                                                                                        : null;
                                                                                    const hasOptions = selectedQuestion?.options?.length > 0;

                                                                                    return (
                                                                                        <div className="flex-1">
                                                                                            <input
                                                                                                type="text"
                                                                                                list={hasOptions ? `options-${question.id}-visible` : undefined}
                                                                                                className="w-full text-sm border rounded px-2 py-1"
                                                                                                placeholder="Value"
                                                                                                value={question.conditions.visible_if.value || ''}
                                                                                                onChange={(e) => {
                                                                                                    updateQuestionCondition(section.id, question.id, 'visible_if', {
                                                                                                        ...question.conditions.visible_if,
                                                                                                        value: e.target.value
                                                                                                    });
                                                                                                }}
                                                                                            />
                                                                                            {hasOptions && (
                                                                                                <datalist id={`options-${question.id}-visible`}>
                                                                                                    {selectedQuestion.options.map((option, index) => (
                                                                                                        <option key={index} value={option} />
                                                                                                    ))}
                                                                                                </datalist>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {(question.type === 'radio' || question.type === 'checkbox' || question.type === 'dropdown') && (
                                                            <div className="mt-4 space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="font-medium text-sm">Section Navigation</h4>
                                                                    <label className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={question.sectionNavigation.enabled}
                                                                            onChange={(e) => {
                                                                                updateSectionNavigation(section.id, question.id, {
                                                                                    enabled: e.target.checked,
                                                                                    rules: question.sectionNavigation.rules
                                                                                });
                                                                            }}
                                                                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                                        />
                                                                        <span className="text-sm">Enable section navigation</span>
                                                                    </label>
                                                                </div>

                                                                {question.sectionNavigation.enabled && (
                                                                    <div className="space-y-2 mt-2">
                                                                        {question.options.map((option, index) => (
                                                                            <div key={index} className="flex items-center gap-2 pl-4">
                                                                                <span className="text-sm text-gray-600">{option}:</span>
                                                                                <select
                                                                                    className="text-sm border rounded px-2 py-1 flex-1"
                                                                                    value={
                                                                                        question.sectionNavigation.rules.find(
                                                                                            rule => rule.value === option
                                                                                        )?.goToSection || ''
                                                                                    }
                                                                                    onChange={(e) => {
                                                                                        const newRules = [...question.sectionNavigation.rules];
                                                                                        const existingRuleIndex = newRules.findIndex(
                                                                                            rule => rule.value === option
                                                                                        );

                                                                                        if (existingRuleIndex >= 0) {
                                                                                            if (e.target.value) {
                                                                                                newRules[existingRuleIndex] = {
                                                                                                    value: option,
                                                                                                    goToSection: e.target.value
                                                                                                };
                                                                                            } else {
                                                                                                newRules.splice(existingRuleIndex, 1);
                                                                                            }
                                                                                        } else if (e.target.value) {
                                                                                            newRules.push({
                                                                                                value: option,
                                                                                                goToSection: e.target.value
                                                                                            });
                                                                                        }

                                                                                        updateSectionNavigation(section.id, question.id, {
                                                                                            enabled: true,
                                                                                            rules: newRules
                                                                                        });
                                                                                    }}
                                                                                >
                                                                                    <option value="">Continue to next section</option>
                                                                                    {formData.sections
                                                                                        .filter(s => s.id !== section.id)
                                                                                        .map(s => (
                                                                                            <option key={s.id} value={s.id}>
                                                                                                Go to: {s.title}
                                                                                            </option>
                                                                                        ))}
                                                                                    <option value="submit">Submit form</option>
                                                                                </select>
                                                                                {question.sectionNavigation.rules.find(
                                                                                    rule => rule.value === option
                                                                                )?.goToSection && (
                                                                                        <ArrowRight className="text-blue-500" size={20} />
                                                                                    )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Question Preview */}
                                            <div className="mt-4">
                                                {question.type === 'short' && (
                                                    <input
                                                        className="w-full border rounded-lg p-2"
                                                        placeholder="Short answer text"
                                                        disabled
                                                    />
                                                )}
                                                {question.type === 'long' && (
                                                    <textarea
                                                        className="w-full border rounded-lg p-2"
                                                        placeholder="Long answer text"
                                                        disabled
                                                    />
                                                )}
                                                {(question.type === 'radio' || question.type === 'checkbox') && (
                                                    <div className="space-y-2">
                                                        {question.options.map((option, index) => (
                                                            <div key={index} className="flex items-center gap-2">
                                                                {question.type === 'radio' ? (
                                                                    <input type="radio" disabled />
                                                                ) : (
                                                                    <input type="checkbox" disabled />
                                                                )}
                                                                <input
                                                                    className="border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                                                                    value={option}
                                                                    onChange={(e) => {
                                                                        const newOptions = [...question.options];
                                                                        newOptions[index] = e.target.value;
                                                                        setFormData({
                                                                            ...formData,
                                                                            sections: formData.sections.map(s =>
                                                                                s.id === section.id ? {
                                                                                    ...s,
                                                                                    questions: s.questions.map(q =>
                                                                                        q.id === question.id ? { ...q, options: newOptions } : q
                                                                                    )
                                                                                } : s
                                                                            )
                                                                        });
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    sections: formData.sections.map(s =>
                                                                        s.id === section.id ? {
                                                                            ...s,
                                                                            questions: s.questions.map(q =>
                                                                                q.id === question.id ? {
                                                                                    ...q,
                                                                                    options: [...q.options, `Option ${q.options.length + 1}`]
                                                                                } : q
                                                                            )
                                                                        } : s
                                                                    )
                                                                });
                                                            }}
                                                            className="text-blue-500 hover:text-blue-700"
                                                        >
                                                            Add option
                                                        </button>
                                                    </div>
                                                )}
                                                {question.type === 'dropdown' && (
                                                    <div className="space-y-2">
                                                        <select className="w-full border rounded-lg p-2" disabled>
                                                            <option value="">Select an option</option>
                                                            {question.options.map((option, index) => (
                                                                <option key={index} value={option}>{option}</option>
                                                            ))}
                                                        </select>
                                                        <div className="space-y-2">
                                                            {question.options.map((option, index) => (
                                                                <div key={index} className="flex items-center gap-2">
                                                                    <input
                                                                        className="flex-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                                                                        value={option}
                                                                        onChange={(e) => {
                                                                            const newOptions = [...question.options];
                                                                            newOptions[index] = e.target.value;
                                                                            setFormData({
                                                                                ...formData,
                                                                                sections: formData.sections.map(s =>
                                                                                    s.id === section.id ? {
                                                                                        ...s,
                                                                                        questions: s.questions.map(q =>
                                                                                            q.id === question.id ? { ...q, options: newOptions } : q
                                                                                        )
                                                                                    } : s
                                                                                )
                                                                            });
                                                                        }}
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            const newOptions = question.options.filter((_, i) => i !== index);
                                                                            setFormData({
                                                                                ...formData,
                                                                                sections: formData.sections.map(s =>
                                                                                    s.id === section.id ? {
                                                                                        ...s,
                                                                                        questions: s.questions.map(q =>
                                                                                            q.id === question.id ? { ...q, options: newOptions } : q
                                                                                        )
                                                                                    } : s
                                                                                )
                                                                            });
                                                                        }}
                                                                        className="text-gray-500 hover:text-red-500"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() => {
                                                                    setFormData({
                                                                        ...formData,
                                                                        sections: formData.sections.map(s =>
                                                                            s.id === section.id ? {
                                                                                ...s,
                                                                                questions: s.questions.map(q =>
                                                                                    q.id === question.id ? {
                                                                                        ...q,
                                                                                        options: [...q.options, `Option ${q.options.length + 1}`]
                                                                                    } : q
                                                                                )
                                                                            } : s
                                                                        )
                                                                    });
                                                                }}
                                                                className="text-blue-500 hover:text-blue-700"
                                                            >
                                                                Add option
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                {question.type === 'file' && (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="file"
                                                            className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-md file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100"
                                                            disabled
                                                        />
                                                    </div>
                                                )}
                                                {question.type === 'date' && (
                                                    <input
                                                        type="date"
                                                        className="w-full border rounded-lg p-2"
                                                        disabled
                                                    />
                                                )}
                                                {question.type === 'time' && (
                                                    <input
                                                        type="time"
                                                        className="w-full border rounded-lg p-2"
                                                        disabled
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Question Button */}
                                    <button
                                        onClick={() => addQuestion(section.id)}
                                        className="w-full py-2 border-2 border-dashed rounded-lg text-gray-500 hover:text-blue-500 hover:border-blue-500 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={20} />
                                        Add Question
                                    </button>

                                    {/* What section is next */}
                                    {formData.sections.length > 1 && // Only show when multiple sections exist
                                        section.id !== formData.sections[formData.sections.length - 1].id && // Hide for last section
                                        (
                                            <div className="mt-4 flex items-center gap-2 text-sm">
                                                <span>After this section:</span>
                                                <select
                                                    className="border rounded px-2 py-1"
                                                    value={section.nextSection || ''}
                                                    onChange={(e) => {
                                                        setFormData({
                                                            ...formData,
                                                            sections: formData.sections.map(s =>
                                                                s.id === section.id ? {
                                                                    ...s,
                                                                    nextSection: e.target.value || null
                                                                } : s
                                                            )
                                                        });
                                                    }}
                                                >
                                                    <option value="">Continue to next section</option>
                                                    {formData.sections
                                                        .filter(s => s.id !== section.id && // Don't allow selecting current section
                                                            s.id !== formData.sections[formData.sections.length - 1].id) // Don't allow selecting last section
                                                        .map(s => (
                                                            <option key={s.id} value={s.id}>
                                                                Go to: {s.title}
                                                            </option>
                                                        ))}
                                                    <option value="submit">Submit form</option>
                                                </select>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add Section Button */}
                    <button
                        onClick={addSection}
                        className="w-full py-3 border-2 border-dashed rounded-lg text-gray-500 hover:text-blue-500 hover:border-blue-500 flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Add Section
                    </button>
                </>
            )
            }

            {/* Add the submitted data display right after the sections */}
            {submittedData && (
                <div className="mt-6 space-y-4">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">Form Structure</h3>
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                            {JSON.stringify(formData, null, 2)}
                        </pre>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">Form Responses</h3>
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                            {JSON.stringify(submittedData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GoogleLikeFormBuilder;