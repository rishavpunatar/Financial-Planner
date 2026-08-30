import { useId } from 'react';

const RangeSlider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  disabled = false,
}) => {
  const id = useId();

  return (
    <div className={`slider-block${disabled ? ' slider-block-disabled' : ''}`}>
      <div className="slider-label">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{formatValue ? formatValue(value) : value}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="slider-input"
        disabled={disabled}
      />
    </div>
  );
};

export default RangeSlider;
