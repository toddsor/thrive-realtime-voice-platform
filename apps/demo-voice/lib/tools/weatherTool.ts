import { ToolCall, ToolCallResponse } from "@thrivereflections/realtime-contracts";

/**
 * Example: Custom Weather Tool
 *
 * This demonstrates how to create a custom tool that can be registered with the tool gateway.
 * The tool follows the platform's tool interface and includes proper error handling.
 */

export interface WeatherToolArgs {
  location: string;
  units?: "celsius" | "fahrenheit";
}

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  units: string;
}

/**
 * Weather tool implementation
 * In a real application, this would call an actual weather API
 */
export async function weatherTool(args: WeatherToolArgs): Promise<WeatherData> {
  const { location, units = "celsius" } = args;

  // Validate input
  if (!location || location.trim().length === 0) {
    throw new Error("Location is required");
  }

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock weather data (in real app, call weather API)
  const mockWeatherData: WeatherData = {
    location: location.trim(),
    temperature: units === "celsius" ? 22 : 72,
    description: "Partly cloudy",
    humidity: 65,
    windSpeed: units === "celsius" ? 15 : 9, // km/h vs mph
    units: units === "celsius" ? "°C" : "°F",
  };

  return mockWeatherData;
}

/**
 * Tool definition for registration
 */
export const weatherToolDefinition = {
  type: "function" as const,
  name: "get_weather",
  description: "Get current weather information for a location",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The city or location to get weather for (e.g., 'New York', 'London, UK')",
      },
      units: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "Temperature units (default: celsius)",
      },
    },
    required: ["location"],
  },
};

/**
 * Tool handler that processes tool calls and returns responses
 */
export async function handleWeatherToolCall(toolCall: ToolCall): Promise<ToolCallResponse> {
  try {
    const args = toolCall.args as unknown as WeatherToolArgs;
    const weatherData = await weatherTool(args);

    return {
      id: toolCall.id,
      ok: true,
      result: {
        location: weatherData.location,
        temperature: weatherData.temperature,
        units: weatherData.units,
        description: weatherData.description,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
      },
    };
  } catch (error) {
    return {
      id: toolCall.id,
      ok: false,
      error: `Error getting weather: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Example: How to create a more complex tool with multiple functions
 */
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
}

export interface CreateEventArgs {
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  location?: string;
  description?: string;
}

/**
 * Calendar tool for creating and managing events
 */
export async function createCalendarEvent(args: CreateEventArgs): Promise<CalendarEvent> {
  const { title, startTime, endTime, location, description } = args;

  // Validate input
  if (!title || title.trim().length === 0) {
    throw new Error("Event title is required");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format. Use ISO string format (e.g., '2024-01-15T10:00:00Z')");
  }

  if (start >= end) {
    throw new Error("Start time must be before end time");
  }

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock event creation
  const event: CalendarEvent = {
    id: `event_${Date.now()}`,
    title: title.trim(),
    startTime: start,
    endTime: end,
    location,
    description,
  };

  return event;
}

export const calendarToolDefinition = {
  type: "function" as const,
  name: "create_calendar_event",
  description: "Create a new calendar event",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "The title of the event",
      },
      startTime: {
        type: "string",
        description: "Start time in ISO format (e.g., '2024-01-15T10:00:00Z')",
      },
      endTime: {
        type: "string",
        description: "End time in ISO format (e.g., '2024-01-15T11:00:00Z')",
      },
      location: {
        type: "string",
        description: "Optional location for the event",
      },
      description: {
        type: "string",
        description: "Optional description of the event",
      },
    },
    required: ["title", "startTime", "endTime"],
  },
};

export async function handleCalendarToolCall(toolCall: ToolCall): Promise<ToolCallResponse> {
  try {
    const args = toolCall.args as unknown as CreateEventArgs;
    const event = await createCalendarEvent(args);

    return {
      id: toolCall.id,
      ok: true,
      result: {
        title: event.title,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        location: event.location,
        description: event.description,
      },
    };
  } catch (error) {
    return {
      id: toolCall.id,
      ok: false,
      error: `Error creating calendar event: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
