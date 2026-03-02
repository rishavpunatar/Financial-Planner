const RangeSlider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  disabled = false,
}) => (
  <div className={`slider-block${disabled ? ' slider-block-disabled' : ''}`}>
    <label className="slider-label">
      {label}: {formatValue ? formatValue(value) : value}
    </label>
    <input
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

export default RangeSlider;
