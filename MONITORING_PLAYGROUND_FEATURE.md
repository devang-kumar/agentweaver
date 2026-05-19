# Enhanced Monitoring Playground Feature

## Overview
The monitoring section now includes a dynamic playground that automatically updates when a new ML pipeline is running. This provides real-time testing capabilities for newly generated models.

## Key Features

### 1. Pipeline Status Detection
- **Real-time Pipeline Tracking**: The monitoring page now detects when a pipeline is actively running
- **Visual Indicators**: Shows pipeline status with color-coded badges and notifications
- **Domain Information**: Displays the current pipeline's domain, problem type, and target variables

### 2. Dynamic Playground Updates
- **Automatic Feature Loading**: When a new pipeline starts, the playground automatically updates with the correct features
- **Smart Feature Detection**: Supports both CSV metadata and domain-based feature sets
- **Type-aware Controls**: Automatically generates appropriate input controls (sliders, dropdowns, number inputs)

### 3. Visual Enhancements
- **Pipeline Running Banner**: Shows a prominent notification when a pipeline is active
- **Updated Badges**: Playground sections show "UPDATED" and "LIVE" badges during active pipelines
- **Progress Indicators**: Shows code generation status (Generating, Ready, etc.)
- **Success Notifications**: Displays confirmation when playground is updated with new pipeline data

### 4. Enhanced User Experience
- **Contextual Information**: Shows pipeline-specific details in the inference output section
- **Auto-dismiss Notifications**: Success messages automatically hide after 5 seconds
- **Smooth Animations**: Uses Framer Motion for polished transitions and feedback

## How It Works

### Pipeline Detection
```javascript
// Monitors active pipeline status
const { latestResults, activePipeline, codeGenStatus } = usePipeline();

// Detects new pipelines and updates playground
useEffect(() => {
  const currentPipelineId = activePipeline?.id;
  if (currentPipelineId && currentPipelineId !== lastPipelineId) {
    setPlaygroundUpdated(true);
    setLastPipelineId(currentPipelineId);
    setTimeout(() => setPlaygroundUpdated(false), 5000);
  }
}, [activePipeline?.id, lastPipelineId]);
```

### Feature Loading Priority
1. **Server Schema** (if connected): Loads from OpenAPI schema at `localhost:8000/openapi.json`
2. **CSV Metadata** (if available): Uses uploaded CSV feature specifications
3. **Domain Features** (fallback): Uses predefined feature sets based on problem domain
4. **Default Features** (final fallback): Generic feature set

### Visual States
- **Pipeline Running**: Purple-themed notifications and borders
- **Code Generating**: Yellow/amber loading indicators
- **Model Ready**: Green success indicators
- **Playground Updated**: Animated success notification with auto-dismiss

## Usage

1. **Start a Pipeline**: Go to the Pipeline page and run a new ML pipeline
2. **Navigate to Monitoring**: The monitoring page will automatically detect the running pipeline
3. **See Updates**: The playground will show updated features and target variables
4. **Test Model**: Once the model is ready, use the playground to test predictions
5. **Real-time Feedback**: Monitor latency, volume, and error metrics in real-time

## Technical Implementation

### State Management
- Uses React hooks for local state management
- Integrates with existing PipelineContext for pipeline data
- Maintains playground update history to prevent duplicate notifications

### Performance Optimizations
- Efficient re-rendering with proper dependency arrays
- Automatic cleanup of timers and intervals
- Smooth animations without blocking UI

### Error Handling
- Graceful fallbacks when server is offline
- Clear error messages for failed predictions
- Robust feature loading with multiple fallback strategies

## Future Enhancements

1. **Model Comparison**: Side-by-side testing of multiple models
2. **Batch Testing**: Upload test datasets for bulk predictions
3. **Performance Benchmarking**: Automated performance testing during pipeline runs
4. **Export Results**: Save prediction results and performance metrics
5. **Custom Feature Sets**: Allow users to define custom feature configurations

## Files Modified

- `src/pages/Monitoring.jsx`: Enhanced with pipeline detection and dynamic playground updates
- `src/context/PipelineContext.jsx`: Already provided pipeline status tracking (no changes needed)

The feature is now live and ready for testing! 🚀