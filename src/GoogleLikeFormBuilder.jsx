import React, { useState } from 'react';
import { Trash2, Copy, ChevronDown, ChevronRight, ChevronLeft, Plus, Settings, Eye, EyeOff, ArrowRight, GripHorizontal } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PreviewMode = ({ formData, formResponses, setFormResponses, setSubmittedData }) => {
    const [navigationHistory, setNavigationHistory] = useState([0]);
    const [currentSection, setCurrentSection] = useState(0);
    const [validationErrors, setValidationErrors] = useState({});

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePhone = (phone) => {
        const re = /^\+?[\d\s-]{10,}$/;
        return re.test(phone);
    };

    const validateQuestion = (question, value) => {
        if (!value && question.required) {
            return 'This field is required';
        }

        if (question.key === 'email' && value && !validateEmail(value)) {
            return 'Please enter a valid email address';
        }

        if (question.key === 'phone' && value && !validatePhone(value)) {
            return 'Please enter a valid phone number';
        }

        if (Array.isArray(value) && question.required && value.length === 0) {
            return 'Please select at least one option';
        }

        return null;
    };

    const validateSection = (sectionIndex) => {
        const section = formData.sections[sectionIndex];
        const errors = {};
        let isValid = true;

        section.questions.forEach(question => {
            // Skip validation if question is not visible
            if (!evaluateCondition(question.conditions.visible_if)) {
                return;
            }

            // Check if question is required based on conditions
            const isRequired = question.required ||
                (question.conditions.required_if && evaluateCondition(question.conditions.required_if));

            if (isRequired) {
                const error = validateQuestion(question, formResponses[question.id]);
                if (error) {
                    errors[question.id] = error;
                    isValid = false;
                }
            }
        });

        setValidationErrors(errors);
        return isValid;
    };

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
        if (!validateSection(currentSection)) {
            return; // Stop navigation if validation fails
        }

        const nextSection = getNextSection();
        if (nextSection === 'submit') {
            handleSubmit();
        } else if (nextSection < formData.sections.length) {
            setNavigationHistory(prev => [...prev, nextSection]);
            setCurrentSection(nextSection);
            setValidationErrors({}); // Clear validation errors when moving to next section
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
        if (!validateSection(currentSection)) {
            return;
        }
    
        // Create a mapping of question IDs to their keys
        const questionKeyMap = {};
        formData.sections.forEach(section => {
            section.questions.forEach(question => {
                if (question.key) {
                    questionKeyMap[question.id] = question.key;
                }
            });
        });
    
        // Transform the responses using the key mapping
        const transformedResponses = {};
        Object.entries(formResponses).forEach(([questionId, response]) => {
            const key = questionKeyMap[questionId];
            // Only include responses that have a corresponding key
            if (key) {
                transformedResponses[key] = response;
            } else {
                // For questions without keys, use the ID as fallback
                transformedResponses[questionId] = response;
            }
        });
    
        setSubmittedData({
            responses: transformedResponses,
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

        const error = validationErrors[question.id];
        const inputClassName = `w-full border rounded-lg p-2 ${error ? 'border-red-500' : ''}`;

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
                    <div>
                        <input
                            type="text"
                            className={inputClassName}
                            value={formResponses[question.id] || ''}
                            onChange={(e) => handleInputChange(question.id, e.target.value)}
                            disabled={question.disabled}
                            readOnly={question.readonly}
                            placeholder={question.placeholder}
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                )}

                {question.type === 'long' && (
                    <div>
                        <textarea
                            className={inputClassName}
                            value={formResponses[question.id] || ''}
                            onChange={(e) => handleInputChange(question.id, e.target.value)}
                            disabled={question.disabled}
                            readOnly={question.readonly}
                            placeholder={question.placeholder}
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                )}

                {question.type === 'radio' && (
                    <div>
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
                                        className={`border-gray-300 text-blue-500 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`}
                                    />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </div>
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                )}

                {question.type === 'checkbox' && (
                    <div>
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
                                        className={`rounded border-gray-300 text-blue-500 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`}
                                    />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </div>
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                )}

                {question.type === 'dropdown' && (
                    <div>
                        <select
                            className={inputClassName}
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
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                )}

                {question.type === 'file' && (
                    <div>
                        <input
                            type="file"
                            className={`block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                ${error ? 'border-red-500' : ''}`}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                handleInputChange(question.id, file ? file.name : '');
                            }}
                            disabled={question.disabled}
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                )}

                {question.type === 'date' && (
                    <div>
                        <input
                            type="date"
                            className={inputClassName}
                            value={formResponses[question.id] || ''}
                            onChange={(e) => handleInputChange(question.id, e.target.value)}
                            disabled={question.disabled}
                            readOnly={question.readonly}
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                )}

                {question.type === 'time' && (
                    <div>
                        <input
                            type="time"
                            className={inputClassName}
                            value={formResponses[question.id] || ''}
                            onChange={(e) => handleInputChange(question.id, e.target.value)}
                            disabled={question.disabled}
                            readOnly={question.readonly}
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                )}
            </div>
        );
    };

    const currentSectionData = formData.sections[currentSection];

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">

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

// Sortable Section Component
const SortableSection = ({ section, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-lg shadow-sm mb-6"
        >
            <div className="p-4 border-b">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-1.5 rounded cursor-move mt-1" {...attributes} {...listeners}>
                        <GripHorizontal className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sortable Question Component
const SortableQuestion = ({ question, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="mb-6"
        >
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="bg-white p-1.5 rounded shadow-sm cursor-move" {...attributes} {...listeners}>
                        <GripHorizontal className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                        {children}
                    </div>
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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        if (active.id !== over.id) {
            setFormData((formData) => {
                const oldIndex = formData.sections.findIndex(
                    (section) => section.id === active.id
                );
                const newIndex = formData.sections.findIndex(
                    (section) => section.id === over.id
                );

                return {
                    ...formData,
                    sections: arrayMove(formData.sections, oldIndex, newIndex),
                };
            });
        }
    };

    const handleQuestionDragEnd = (sectionId) => (event) => {
        const { active, over } = event;

        if (!over) return;

        if (active.id !== over.id) {
            setFormData((formData) => {
                const section = formData.sections.find((s) => s.id === sectionId);
                const oldIndex = section.questions.findIndex(
                    (question) => question.id === active.id
                );
                const newIndex = section.questions.findIndex(
                    (question) => question.id === over.id
                );

                const newQuestions = arrayMove(
                    section.questions,
                    oldIndex,
                    newIndex
                );

                return {
                    ...formData,
                    sections: formData.sections.map((s) =>
                        s.id === sectionId
                            ? { ...s, questions: newQuestions }
                            : s
                    ),
                };
            });
        }
    };

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
                // This was the bug - comparing section.id with section.id instead of sectionId
                if (section.id === sectionId) {  // <-- Fixed this line
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
                // Collapse all other sections
                return {
                    ...section,
                    isCollapsed: true
                };
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={formData.sections.map((s) => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {formData.sections.map((section) => (
                                <SortableSection key={section.id} section={section}>
                                    <div key={section.id} className="bg-white rounded-lg">
                                        {/* Section Header */}
                                        <div className="">
                                            <div className="flex flex-col w-full">
                                                <div className="flex items-center gap-4 w-full">
                                                    <button
                                                        onClick={() => toggleSectionCollapse(section.id)}
                                                        className="text-gray-500 hover:text-gray-700 shrink-0"
                                                    >
                                                        {section.isCollapsed ? <ChevronRight /> : <ChevronDown />}
                                                    </button>
                                                    <input
                                                        className="flex-1 text-xl font-semibold border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none min-w-0"
                                                        value={section.title}
                                                        placeholder="Section title"
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
                                                        className="text-gray-500 hover:text-red-500 shrink-0"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                                <div className="ml-10 mt-1">
                                                    <input
                                                        className="w-full text-sm text-gray-600 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                                                        value={section.description || ''}
                                                        placeholder="Section description (optional)"
                                                        onChange={(e) => {
                                                            setFormData({
                                                                ...formData,
                                                                sections: formData.sections.map(s =>
                                                                    s.id === section.id ? { ...s, description: e.target.value } : s
                                                                )
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section Content */}
                                        {!section.isCollapsed && (
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCorners}
                                                onDragEnd={handleQuestionDragEnd(
                                                    section.id
                                                )}
                                            >
                                                <SortableContext
                                                    items={section.questions.map(
                                                        (q) => q.id
                                                    )}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    <div className="p-6">
                                                        {/* Questions */}
                                                        {section.questions.map((question) => (
                                                            <SortableQuestion
                                                                key={question.id}
                                                                question={question}
                                                            >
                                                                <div
                                                                    key={question.id}
                                                                    className={`pt-4 pl-4 pr-4 rounded-lg ${!question.visible ? 'opacity-50' : ''
                                                                        }`}
                                                                >
                                                                    {/* Question Header */}
                                                                    <div className="flex items-center gap-4 mb-2 flex-wrap">
                                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
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
                                                                                    className="border rounded px-2 py-1 text-sm shrink-0"
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
                                                                                className="flex-1 font-medium border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none min-w-0"
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
                                                                        </div>
                                                                        <div className="flex items-center gap-4 shrink-0">
                                                                            <button
                                                                                onClick={() => duplicateQuestion(section.id, question.id)}
                                                                                className="text-gray-500 hover:text-blue-500"
                                                                            >
                                                                                <Copy size={20} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setSelectedQuestion(question.id === selectedQuestion ? null : question.id)}
                                                                                className={`text-gray-500 hover:text-blue-500 ${selectedQuestion === question.id ? 'text-blue-500' : ''}`}
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

                                                                                                {['equals', 'not_equals'].includes(question.conditions.required_if.type) && (
                                                                                                    <>
                                                                                                        {(() => {
                                                                                                            const selectedQuestion = formData.sections
                                                                                                                .flatMap(s => s.questions)
                                                                                                                .find(q => q.id.toString() === question.conditions.required_if.questionId?.toString());
                                                                                                            const hasOptions = selectedQuestion?.options?.length > 0;

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

                                                                                                {['equals', 'not_equals'].includes(question.conditions.visible_if.type) && (
                                                                                                    <>
                                                                                                        {(() => {
                                                                                                            const selectedQuestion = formData.sections
                                                                                                                .flatMap(s => s.questions)
                                                                                                                .find(q => q.id.toString() === question.conditions.visible_if.questionId?.toString());
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
                                                            </SortableQuestion>
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
                                                </SortableContext>
                                            </DndContext>
                                        )}
                                    </div>
                                </SortableSection>
                            ))}
                        </SortableContext>

                        {/* Add Section Button */}
                        <button
                            onClick={addSection}
                            className="w-full py-3 border-2 border-dashed rounded-lg text-gray-500 hover:text-blue-500 hover:border-blue-500 flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            Add Section
                        </button>

                        {/* Form Import Section */}
                        <div className="mt-8 space-y-4">
                            <h2 className="text-lg font-semibold">Form JSON:</h2>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <pre className="text-sm overflow-auto">
                                    {JSON.stringify(formData, null, 2)}
                                </pre>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">Import Form Definition</h2>
                                <textarea
                                    className="w-full h-40 p-4 border rounded-lg font-mono text-sm"
                                    placeholder="Paste your form JSON here..."
                                    onChange={(e) => {
                                        try {
                                            const imported = JSON.parse(e.target.value);
                                            // You might want to add validation here
                                            setFormData(imported);
                                        } catch (error) {
                                            // Optionally handle parse errors
                                            console.error('Invalid JSON');
                                        }
                                    }}
                                />
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-flex items-center gap-2"
                                    onClick={() => {
                                        const textarea = document.querySelector('textarea');
                                        if (textarea.value) {
                                            try {
                                                const imported = JSON.parse(textarea.value);
                                                setFormData(imported);
                                            } catch (error) {
                                                alert('Invalid JSON format');
                                            }
                                        }
                                    }}
                                >
                                    Import JSON
                                </button>
                            </div>
                        </div>
                    </DndContext>
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