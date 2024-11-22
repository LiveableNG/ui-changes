import React, { useState } from 'react';
import {
    PlusCircle,
    Trash2,
    MoveUp,
    MoveDown,
    Eye,
    EyeOff,
    Layout,
    Settings,
    Upload,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

// Utility function to generate unique IDs
const generateId = () => `_${Math.random().toString(36).substr(2, 9)}`;

// Constants for question types and validation
const QUESTION_TYPES = [
    { value: 'text', label: 'Short Answer' },
    { value: 'textarea', label: 'Long Answer' },
    { value: 'radio', label: 'Multiple Choice' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'select', label: 'Dropdown' },
    { value: 'scale', label: 'Linear Scale' },
    { value: 'grid', label: 'Multiple-Choice Grid' },
    { value: 'file', label: 'File Upload' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' }
];

const VALIDATION_TYPES = {
    text: ['minLength', 'maxLength', 'regex'],
    textarea: ['minLength', 'maxLength', 'wordCount'],
    email: ['format'],
    number: ['min', 'max', 'step'],
    date: ['minDate', 'maxDate'],
    file: ['maxSize', 'fileTypes']
};

const DEFAULT_QUESTION = {
    type: 'text',
    question: '',
    required: false,
    options: ['Option 1'],
    conditions: [],
    validation: {},
    gridRows: ['Row 1'],
    gridColumns: ['Column 1'],
    scaleStart: 1,
    scaleEnd: 5,
    scaleLabels: { start: '', end: '' },
    fileTypes: ['.pdf', '.doc', '.docx'],
    maxFileSize: 5,
    description: ''
};

// Validation component
const ValidationEditor = ({ questionType, validation, onChange }) => {
    const availableValidations = VALIDATION_TYPES[questionType] || [];

    return (
        <div className="mt-4 space-y-2 border-t pt-4">
            <h4 className="font-medium text-sm">Validation Rules</h4>
            {availableValidations.map(validationType => (
                <div key={validationType} className="flex items-center gap-2">
                    <label className="text-sm flex items-center gap-2">
                        {validationType}:
                        {validationType === 'fileTypes' ? (
                            <input
                                type="text"
                                value={validation[validationType] || ''}
                                onChange={e => onChange({ ...validation, [validationType]: e.target.value })}
                                placeholder="e.g., .pdf,.doc,.jpg"
                                className="flex-1 p-1 border rounded text-sm"
                            />
                        ) : validationType.includes('Date') ? (
                            <input
                                type="date"
                                value={validation[validationType] || ''}
                                onChange={e => onChange({ ...validation, [validationType]: e.target.value })}
                                className="flex-1 p-1 border rounded text-sm"
                            />
                        ) : (
                            <input
                                type={['min', 'max', 'step', 'minLength', 'maxLength'].includes(validationType) ? 'number' : 'text'}
                                value={validation[validationType] || ''}
                                onChange={e => onChange({ ...validation, [validationType]: e.target.value })}
                                className="flex-1 p-1 border rounded text-sm"
                            />
                        )}
                    </label>
                </div>
            ))}
        </div>
    );
};

// Grid Editor Component
const GridEditor = ({ question, onChange }) => {
    const addGridRow = () => {
        const newRows = [...question.gridRows, `Row ${question.gridRows.length + 1}`];
        onChange({ ...question, gridRows: newRows });
    };

    const addGridColumn = () => {
        const newColumns = [...question.gridColumns, `Column ${question.gridColumns.length + 1}`];
        onChange({ ...question, gridColumns: newColumns });
    };

    return (
        <div className="mt-4 space-y-4">
            <div>
                <h4 className="font-medium text-sm mb-2">Rows</h4>
                {question.gridRows.map((row, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                            type="text"
                            value={row}
                            onChange={e => {
                                const newRows = [...question.gridRows];
                                newRows[index] = e.target.value;
                                onChange({ ...question, gridRows: newRows });
                            }}
                            className="p-2 border rounded"
                        />
                        <button
                            onClick={() => {
                                if (question.gridRows.length > 1) {
                                    const newRows = question.gridRows.filter((_, i) => i !== index);
                                    onChange({ ...question, gridRows: newRows });
                                }
                            }}
                            className="text-red-600 hover:text-red-800"
                            disabled={question.gridRows.length === 1}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={addGridRow}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    <PlusCircle size={16} /> Add Row
                </button>
            </div>

            <div>
                <h4 className="font-medium text-sm mb-2">Columns</h4>
                {question.gridColumns.map((col, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                            type="text"
                            value={col}
                            onChange={e => {
                                const newColumns = [...question.gridColumns];
                                newColumns[index] = e.target.value;
                                onChange({ ...question, gridColumns: newColumns });
                            }}
                            className="p-2 border rounded"
                        />
                        <button
                            onClick={() => {
                                if (question.gridColumns.length > 1) {
                                    const newColumns = question.gridColumns.filter((_, i) => i !== index);
                                    onChange({ ...question, gridColumns: newColumns });
                                }
                            }}
                            className="text-red-600 hover:text-red-800"
                            disabled={question.gridColumns.length === 1}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={addGridColumn}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    <PlusCircle size={16} /> Add Column
                </button>
            </div>
        </div>
    );
};

// Scale Editor Component
const ScaleEditor = ({ question, onChange }) => {
    return (
        <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Start Number</label>
                    <input
                        type="number"
                        value={question.scaleStart}
                        onChange={e => onChange({
                            ...question,
                            scaleStart: parseInt(e.target.value)
                        })}
                        className="p-2 border rounded w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">End Number</label>
                    <input
                        type="number"
                        value={question.scaleEnd}
                        onChange={e => onChange({
                            ...question,
                            scaleEnd: parseInt(e.target.value)
                        })}
                        className="p-2 border rounded w-full"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Start Label</label>
                    <input
                        type="text"
                        value={question.scaleLabels.start}
                        onChange={e => onChange({
                            ...question,
                            scaleLabels: { ...question.scaleLabels, start: e.target.value }
                        })}
                        className="p-2 border rounded w-full"
                        placeholder="e.g., Poor"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">End Label</label>
                    <input
                        type="text"
                        value={question.scaleLabels.end}
                        onChange={e => onChange({
                            ...question,
                            scaleLabels: { ...question.scaleLabels, end: e.target.value }
                        })}
                        className="p-2 border rounded w-full"
                        placeholder="e.g., Excellent"
                    />
                </div>
            </div>
        </div>
    );
};

// Options Editor Component
const OptionsEditor = ({ question, onChange }) => {
    const addOption = () => {
        const newOptions = [...question.options, `Option ${question.options.length + 1}`];
        onChange({ ...question, options: newOptions });
    };

    const removeOption = (index) => {
        if (question.options.length > 1) {
            const newOptions = question.options.filter((_, i) => i !== index);
            onChange({ ...question, options: newOptions });
        }
    };

    const updateOption = (index, value) => {
        const newOptions = [...question.options];
        newOptions[index] = value;
        onChange({ ...question, options: newOptions });
    };

    return (
        <div className="space-y-2">
            {question.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                    <input
                        type={question.type === 'select' ? 'text' : question.type}
                        disabled
                        className="border rounded"
                    />
                    <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1 p-2 border rounded-md"
                    />
                    <button
                        onClick={() => removeOption(index)}
                        className="p-1 text-red-600 hover:text-red-900"
                        disabled={question.options.length === 1}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
            <button
                onClick={addOption}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
                <PlusCircle size={16} /> Add Option
            </button>
        </div>
    );
};

// Condition Editor Component
const ConditionEditor = ({ allQuestions, conditions, onChange }) => {
    const addCondition = () => {
        const newCondition = {
            id: generateId(),
            sourceQuestionId: '',
            operator: 'equals',
            value: ''
        };
        onChange([...conditions, newCondition]);
    };

    const updateCondition = (conditionId, updates) => {
        const newConditions = conditions.map(c =>
            c.id === conditionId ? { ...c, ...updates } : c
        );
        onChange(newConditions);
    };

    const removeCondition = (conditionId) => {
        const newConditions = conditions.filter(c => c.id !== conditionId);
        onChange(newConditions);
    };

    return (
        <div className="mt-4 space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Conditions</h4>
                <button
                    onClick={addCondition}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    <PlusCircle size={16} /> Add Condition
                </button>
            </div>
            {conditions.map(condition => (
                <div key={condition.id} className="flex items-center gap-2 mt-2">
                    <select
                        value={condition.sourceQuestionId}
                        onChange={e => updateCondition(condition.id, { sourceQuestionId: e.target.value })}
                        className="p-2 text-sm border rounded flex-1"
                    >
                        <option value="">Select question</option>
                        {allQuestions.map(q => (
                            <option key={q.id} value={q.id}>
                                {q.question || 'Untitled Question'}
                            </option>
                        ))}
                    </select>
                    <select
                        value={condition.operator}
                        onChange={e => updateCondition(condition.id, { operator: e.target.value })}
                        className="p-2 text-sm border rounded"
                    >
                        <option value="equals">equals</option>
                        <option value="notEquals">not equals</option>
                        <option value="contains">contains</option>
                        <option value="greaterThan">greater than</option>
                        <option value="lessThan">less than</option>
                    </select>
                    <input
                        type="text"
                        value={condition.value}
                        onChange={e => updateCondition(condition.id, { value: e.target.value })}
                        placeholder="Value"
                        className="p-2 text-sm border rounded flex-1"
                    />
                    <button
                        onClick={() => removeCondition(condition.id)}
                        className="text-red-600 hover:text-red-800"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

// Question Editor Component
const QuestionEditor = ({ question, onChange, onRemove, allQuestions }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <select
                    value={question.type}
                    onChange={(e) => onChange({ ...question, type: e.target.value })}
                    className="p-2 border rounded-md"
                >
                    {QUESTION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
                <button
                    onClick={onRemove}
                    className="p-2 text-red-600 hover:text-red-900"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="space-y-4">
                {/* Question Text */}
                <div>
                    <input
                        type="text"
                        value={question.question}
                        onChange={(e) => onChange({ ...question, question: e.target.value })}
                        placeholder="Question text"
                        className="w-full p-2 border rounded-md"
                    />
                </div>

                {/* Description */}
                <div>
                    <input
                        type="text"
                        value={question.description}
                        onChange={(e) => onChange({ ...question, description: e.target.value })}
                        placeholder="Description (optional)"
                        className="w-full p-2 border rounded-md text-sm text-gray-600"
                    />
                </div>

                {/* Question Type Specific Editors */}
                {['radio', 'checkbox', 'select'].includes(question.type) && (
                    <OptionsEditor
                        question={question}
                        onChange={onChange}
                    />
                )}

                {question.type === 'grid' && (
                    <GridEditor
                        question={question}
                        onChange={onChange}
                    />
                )}

                {question.type === 'scale' && (
                    <ScaleEditor
                        question={question}
                        onChange={onChange}
                    />
                )}

                {question.type === 'file' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Allowed File Types
                            </label>
                            <input
                                type="text"
                                value={question.fileTypes.join(', ')}
                                onChange={e => onChange({
                                    ...question,
                                    fileTypes: e.target.value.split(',').map(t => t.trim())
                                })}
                                placeholder=".pdf, .doc, .jpg"
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Max File Size (MB)
                            </label>
                            <input
                                type="number"
                                value={question.maxFileSize}
                                onChange={e => onChange({
                                    ...question,
                                    maxFileSize: parseInt(e.target.value)
                                })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>
                )}

                {/* Validation Editor */}
                {VALIDATION_TYPES[question.type] && (
                    <ValidationEditor
                        questionType={question.type}
                        validation={question.validation}
                        onChange={validation => onChange({ ...question, validation })}
                    />
                )}

                {/* Required Checkbox */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id={`required-${question.id}`}
                        checked={question.required}
                        onChange={(e) => onChange({ ...question, required: e.target.checked })}
                        className="rounded"
                    />
                    <label
                        htmlFor={`required-${question.id}`}
                        className="text-sm font-medium"
                    >
                        Required
                    </label>
                </div>

                {/* Conditions */}
                <ConditionEditor
                    allQuestions={allQuestions}
                    conditions={question.conditions}
                    onChange={conditions => onChange({ ...question, conditions })}
                />
            </div>
        </div>
    );
};

// Section Component
const Section = ({
    section,
    onUpdate,
    onRemove,
    onAddQuestion,
    allQuestions,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown
}) => {
    return (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={section.title}
                        onChange={(e) => onUpdate({ ...section, title: e.target.value })}
                        className="text-xl font-semibold p-2 border-b bg-transparent focus:outline-none focus:border-blue-500 w-full"
                        placeholder="Section Title"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className={`p-2 text-gray-600 hover:text-gray-900 ${isFirst ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ChevronUp size={20} />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className={`p-2 text-gray-600 hover:text-gray-900 ${isLast ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ChevronDown size={20} />
                    </button>
                    <button
                        onClick={onRemove}
                        className="p-2 text-red-600 hover:text-red-900"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Section Description */}
                <input
                    type="text"
                    value={section.description || ''}
                    onChange={(e) => onUpdate({ ...section, description: e.target.value })}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Section description (optional)"
                />

                {/* Section Conditions */}
                <ConditionEditor
                    allQuestions={allQuestions}
                    conditions={section.conditions}
                    onChange={conditions => onUpdate({ ...section, conditions })}
                />

                {/* Questions */}
                <div className="space-y-4">
                    {section.questions.map((question, qIndex) => (
                        <QuestionEditor
                            key={question.id}
                            question={question}
                            onChange={(updatedQuestion) => {
                                const newQuestions = [...section.questions];
                                newQuestions[qIndex] = updatedQuestion;
                                onUpdate({ ...section, questions: newQuestions });
                            }}
                            onRemove={() => {
                                const newQuestions = section.questions.filter(q => q.id !== question.id);
                                onUpdate({ ...section, questions: newQuestions });
                            }}
                            allQuestions={allQuestions}
                        />
                    ))}
                </div>

                <button
                    onClick={() => onAddQuestion({
                        ...DEFAULT_QUESTION,
                        id: generateId()
                    })}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    <PlusCircle size={20} /> Add Question
                </button>
            </div>
        </div>
    );
};

// Preview Mode Component
const FormPreview = ({ formData, onSubmit }) => {
    const [responses, setResponses] = useState({});
    const [errors, setErrors] = useState({});
    const [currentSection, setCurrentSection] = useState(0);

    // Validation functions
    const validateResponse = (question, value) => {
        if (!value && question.required) {
            return 'This field is required';
        }

        const validation = question.validation || {};

        switch (question.type) {
            case 'text':
            case 'textarea':
                if (validation.minLength && value.length < validation.minLength) {
                    return `Minimum length is ${validation.minLength} characters`;
                }
                if (validation.maxLength && value.length > validation.maxLength) {
                    return `Maximum length is ${validation.maxLength} characters`;
                }
                if (validation.regex && !new RegExp(validation.regex).test(value)) {
                    return 'Input format is invalid';
                }
                break;

            case 'email':
                if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    return 'Invalid email format';
                }
                break;

            case 'number':
                const num = Number(value);
                if (validation.min && num < validation.min) {
                    return `Minimum value is ${validation.min}`;
                }
                if (validation.max && num > validation.max) {
                    return `Maximum value is ${validation.max}`;
                }
                break;

            case 'file':
                if (value instanceof File) {
                    if (validation.maxSize && value.size > validation.maxSize * 1024 * 1024) {
                        return `File size must be less than ${validation.maxSize}MB`;
                    }
                    if (validation.fileTypes && !validation.fileTypes.some(type =>
                        value.name.toLowerCase().endsWith(type.toLowerCase())
                    )) {
                        return `File type must be: ${validation.fileTypes.join(', ')}`;
                    }
                }
                break;
        }

        return '';
    };

    const evaluateConditions = (conditions) => {
        if (!conditions || conditions.length === 0) return true;

        return conditions.every(condition => {
            const sourceValue = responses[condition.sourceQuestionId];
            if (!sourceValue) return false;

            switch (condition.operator) {
                case 'equals':
                    return sourceValue === condition.value;
                case 'notEquals':
                    return sourceValue !== condition.value;
                case 'contains':
                    return sourceValue.includes(condition.value);
                case 'greaterThan':
                    return Number(sourceValue) > Number(condition.value);
                case 'lessThan':
                    return Number(sourceValue) < Number(condition.value);
                default:
                    return true;
            }
        });
    };

    const handleResponse = (questionId, value) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: value
        }));
        // Clear error when user starts typing
        setErrors(prev => ({
            ...prev,
            [questionId]: ''
        }));
    };

    const validateSection = (sectionIndex) => {
        const section = formData.sections[sectionIndex];
        const newErrors = {};
        let isValid = true;

        section.questions.forEach(question => {
            if (evaluateConditions(question.conditions)) {
                const error = validateResponse(question, responses[question.id]);
                if (error) {
                    newErrors[question.id] = error;
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleNext = () => {
        if (validateSection(currentSection)) {
            setCurrentSection(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        setCurrentSection(prev => prev - 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateSection(currentSection)) {
            onSubmit(responses);
        }
    };

    const renderQuestion = (question) => {
        if (!evaluateConditions(question.conditions)) {
            return null;
        }

        const error = errors[question.id];

        return (
            <div key={question.id} className="mb-6">
                <label className="block font-medium mb-2">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {question.description && (
                    <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                )}

                {/* Question type specific rendering */}
                {(() => {
                    switch (question.type) {
                        case 'text':
                            return (
                                <input
                                    type="text"
                                    value={responses[question.id] || ''}
                                    onChange={(e) => handleResponse(question.id, e.target.value)}
                                    className={`w-full p-2 border rounded ${error ? 'border-red-500' : ''}`}
                                />
                            );

                        case 'textarea':
                            return (
                                <textarea
                                    value={responses[question.id] || ''}
                                    onChange={(e) => handleResponse(question.id, e.target.value)}
                                    className={`w-full p-2 border rounded ${error ? 'border-red-500' : ''}`}
                                    rows={4}
                                />
                            );

                        case 'radio':
                            return (
                                <div className="space-y-2">
                                    {question.options.map((option, index) => (
                                        <label key={index} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`question-${question.id}`}
                                                value={option}
                                                checked={responses[question.id] === option}
                                                onChange={(e) => handleResponse(question.id, e.target.value)}
                                                className={error ? 'border-red-500' : ''}
                                            />
                                            {option}
                                        </label>
                                    ))}
                                </div>
                            );

                        case 'checkbox':
                            return (
                                <div className="space-y-2">
                                    {question.options.map((option, index) => (
                                        <label key={index} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                value={option}
                                                checked={responses[question.id]?.includes(option)}
                                                onChange={(e) => {
                                                    const currentValues = responses[question.id] || [];
                                                    const newValues = e.target.checked
                                                        ? [...currentValues, option]
                                                        : currentValues.filter(v => v !== option);
                                                    handleResponse(question.id, newValues);
                                                }}
                                                className={error ? 'border-red-500' : ''}
                                            />
                                            {option}
                                        </label>
                                    ))}
                                </div>
                            );

                        case 'select':
                            return (
                                <select
                                    value={responses[question.id] || ''}
                                    onChange={(e) => handleResponse(question.id, e.target.value)}
                                    className={`w-full p-2 border rounded ${error ? 'border-red-500' : ''}`}
                                >
                                    <option value="">Select an option</option>
                                    {question.options.map((option, index) => (
                                        <option key={index} value={option}>{option}</option>
                                    ))}
                                </select>
                            );

                        case 'scale':
                            return (
                                <div className="flex items-center justify-between gap-4 mt-2">
                                    <span className="text-sm">{question.scaleLabels.start}</span>
                                    <div className="flex-1 flex justify-between">
                                        {Array.from(
                                            { length: question.scaleEnd - question.scaleStart + 1 },
                                            (_, i) => i + question.scaleStart
                                        ).map(value => (
                                            <label key={value} className="flex flex-col items-center">
                                                <input
                                                    type="radio"
                                                    name={`scale-${question.id}`}
                                                    value={value}
                                                    checked={responses[question.id] === value.toString()}
                                                    onChange={(e) => handleResponse(question.id, e.target.value)}
                                                    className={error ? 'border-red-500' : ''}
                                                />
                                                <span className="text-sm mt-1">{value}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <span className="text-sm">{question.scaleLabels.end}</span>
                                </div>
                            );

                        case 'grid':
                            return (
                                <table className="w-full border-collapse border">
                                    <thead>
                                        <tr>
                                            <th className="border p-2"></th>
                                            {question.gridColumns.map((col, i) => (
                                                <th key={i} className="border p-2">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {question.gridRows.map((row, i) => (
                                            <tr key={i}>
                                                <td className="border p-2">{row}</td>
                                                {question.gridColumns.map((_, j) => (
                                                    <td key={j} className="border p-2 text-center">
                                                        <input
                                                            type="radio"
                                                            name={`${question.id}-${i}`}
                                                            checked={responses[question.id]?.[row] === question.gridColumns[j]}
                                                            onChange={() => {
                                                                const currentResponses = responses[question.id] || {};
                                                                handleResponse(question.id, {
                                                                    ...currentResponses,
                                                                    [row]: question.gridColumns[j]
                                                                });
                                                            }}
                                                            className={error ? 'border-red-500' : ''}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            );

                        case 'file':
                            return (
                                <div>
                                    <input
                                        type="file"
                                        accept={question.fileTypes.join(',')}
                                        onChange={(e) => handleResponse(question.id, e.target.files[0])}
                                        className={`block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        ${error ? 'border-red-500' : ''}`}
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Allowed types: {question.fileTypes.join(', ')} (Max: {question.maxFileSize}MB)
                                    </p>
                                </div>
                            );

                        case 'email':
                            return (
                                <input
                                    type="email"
                                    value={responses[question.id] || ''}
                                    onChange={(e) => handleResponse(question.id, e.target.value)}
                                    className={`w-full p-2 border rounded ${error ? 'border-red-500' : ''}`}
                                />
                            );

                        case 'number':
                            return (
                                <input
                                    type="number"
                                    value={responses[question.id] || ''}
                                    onChange={(e) => handleResponse(question.id, e.target.value)}
                                    min={question.validation?.min}
                                    max={question.validation?.max}
                                    step={question.validation?.step}
                                    className={`w-full p-2 border rounded ${error ? 'border-red-500' : ''}`}
                                />
                            );

                        case 'date':
                            return (
                                <input
                                    type="date"
                                    value={responses[question.id] || ''}
                                    onChange={(e) => handleResponse(question.id, e.target.value)}
                                    min={question.validation?.minDate}
                                    max={question.validation?.maxDate}
                                    className={`w-full p-2 border rounded ${error ? 'border-red-500' : ''}`}
                                />
                            );

                        default:
                            return null;
                    }
                })()}

                {error && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
            </div>
        );
    };

    const currentSectionData = formData.sections[currentSection];
    const isLastSection = currentSection === formData.sections.length - 1;

    if (!evaluateConditions(currentSectionData.conditions)) {
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <form onSubmit={handleSubmit}>
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{currentSectionData.title}</h2>
                    {currentSectionData.description && (
                        <p className="text-gray-600 mb-6">{currentSectionData.description}</p>
                    )}
                    {currentSectionData.questions.map(renderQuestion)}
                </div>

                <div className="flex justify-between">
                    {currentSection > 0 && (
                        <button
                            type="button"
                            onClick={handlePrevious}
                            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200"
                        >
                            Previous
                        </button>
                    )}
                    {isLastSection ? (
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                        >
                            Submit
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                        >
                            Next
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

// Main FormBuilder Component
const FormBuilder = () => {
    const [formTitle, setFormTitle] = useState('Untitled Form');
    const [formDescription, setFormDescription] = useState('');
    const [sections, setSections] = useState([
        {
            id: generateId(),
            title: 'Section 1',
            description: '',
            questions: [],
            conditions: []
        }
    ]);
    const [isPreview, setIsPreview] = useState(false);

    // Form Management Functions
    const addSection = () => {
        setSections([
            ...sections,
            {
                id: generateId(),
                title: `Section ${sections.length + 1}`,
                description: '',
                questions: [],
                conditions: []
            }
        ]);
    };

    const removeSection = (sectionId) => {
        if (sections.length > 1) {
            setSections(sections.filter(s => s.id !== sectionId));
        }
    };

    const updateSection = (sectionId, updates) => {
        setSections(sections.map(s =>
            s.id === sectionId ? { ...s, ...updates } : s
        ));
    };

    const moveSection = (index, direction) => {
        const newSections = [...sections];
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < sections.length) {
            [newSections[index], newSections[newIndex]] =
                [newSections[newIndex], newSections[index]];
            setSections(newSections);
        }
    };

    // Get all questions for conditional logic
    const getAllQuestions = () => {
        return sections.flatMap(section =>
            section.questions.map(question => ({
                ...question,
                sectionTitle: section.title
            }))
        );
    };

    // Form submission handler
    const handleSubmit = (responses) => {
        console.log('Form Responses:', responses);
        // Here you would typically send the responses to your backend
        alert('Form submitted successfully!');
    };

    // Export form configuration
    const exportForm = () => {
        const formConfig = {
            title: formTitle,
            description: formDescription,
            sections: sections
        };

        const blob = new Blob([JSON.stringify(formConfig, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formTitle.toLowerCase().replace(/\s+/g, '-')}-config.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Import form configuration
    const importForm = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    setFormTitle(config.title);
                    setFormDescription(config.description);
                    setSections(config.sections);
                } catch (error) {
                    alert('Invalid form configuration file');
                }
            };
            reader.readAsText(file);
        }
    };

    // Edit Mode Component
    const EditMode = () => (
        <div className="max-w-3xl mx-auto p-6">
            {/* Form Header */}
            <div className="mb-8">
                <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-3xl font-bold mb-4 p-2 border-b focus:outline-none focus:border-blue-500"
                    placeholder="Form Title"
                />
                <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full text-gray-600 p-2 border-b focus:outline-none focus:border-blue-500"
                    placeholder="Form Description (optional)"
                />
            </div>

            {/* Sections */}
            {sections.map((section, index) => (
                <Section
                    key={section.id}
                    section={section}
                    onUpdate={(updates) => updateSection(section.id, updates)}
                    onRemove={() => removeSection(section.id)}
                    onAddQuestion={(question) => {
                        const updatedSection = {
                            ...section,
                            questions: [...section.questions, question]
                        };
                        updateSection(section.id, updatedSection);
                    }}
                    allQuestions={getAllQuestions()}
                    isFirst={index === 0}
                    isLast={index === sections.length - 1}
                    onMoveUp={() => moveSection(index, -1)}
                    onMoveDown={() => moveSection(index, 1)}
                />
            ))}

            {/* Form Actions */}
            <div className="flex flex-wrap gap-4 mt-8">
                <button
                    onClick={addSection}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                    <Layout size={20} /> Add Section
                </button>
                <button
                    onClick={exportForm}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Download Config
                </button>
                <div className="relative">
                    <input
                        type="file"
                        accept=".json"
                        onChange={importForm}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                        Import Config
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b mb-6">
                <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Form Builder</h1>
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        {isPreview ? (
                            <>
                                <Settings size={20} /> Edit Mode
                            </>
                        ) : (
                            <>
                                <Eye size={20} /> Preview
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            {isPreview ? (
                <FormPreview
                    formData={{
                        title: formTitle,
                        description: formDescription,
                        sections: sections
                    }}
                    onSubmit={handleSubmit}
                />
            ) : (
                <EditMode />
            )}
        </div>
    );
};

export default FormBuilder;