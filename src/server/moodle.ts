export interface MoodleCourseRecord {
  moodleId: number;
  courseCode: string;
  fullName: string;
  categoryName?: string;
  visible: boolean;
  startDateIso?: string;
}

export interface MoodleAdapterStatus {
  configured: boolean;
  authMethod: 'moodle_webservice_rest_token';
  baseUrlHost: string | null;
  siteName?: string;
  moodleRelease?: string;
  supportedFunctions: string[];
  securityGuarantee: string;
}

export interface MoodleCourseSyncResult {
  configured: boolean;
  authMethod: 'moodle_webservice_rest_token';
  courses: MoodleCourseRecord[];
  message: string;
  fieldMapping: Array<{ moodleField: string; learnsenseField: string }>;
}

const MOODLE_FIELD_MAPPING = [
  { moodleField: 'id', learnsenseField: 'courses.moodle_course_id' },
  { moodleField: 'shortname', learnsenseField: 'courses.course_code' },
  { moodleField: 'fullname', learnsenseField: 'courses.name' },
  { moodleField: 'categoryname', learnsenseField: 'courses.subject' },
  { moodleField: 'startdate', learnsenseField: 'courses.semester' },
];

export function isMoodleConfigured(): boolean {
  const baseUrl = (process.env.MOODLE_BASE_URL || '').trim();
  const token = (process.env.MOODLE_WS_TOKEN || '').trim();
  return Boolean(baseUrl && token && /^https?:\/\//i.test(baseUrl));
}

function getSafeBaseUrlHost(): string | null {
  const raw = (process.env.MOODLE_BASE_URL || '').trim();
  if (!raw) return null;
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
}

async function callMoodleRest<T>(wsFunction: string, extraParams: Record<string, string> = {}): Promise<T> {
  const baseUrl = (process.env.MOODLE_BASE_URL || '').trim().replace(/\/+$/, '');
  const token = (process.env.MOODLE_WS_TOKEN || '').trim();
  if (!baseUrl || !token) {
    throw new Error('Moodle REST credentials (MOODLE_BASE_URL, MOODLE_WS_TOKEN) are not configured.');
  }

  const params = new URLSearchParams({
    wstoken: token,
    wsfunction: wsFunction,
    moodlewsrestformat: 'json',
    ...extraParams,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${baseUrl}/webservice/rest/server.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Moodle REST endpoint returned HTTP ${res.status}`);
    }
    const data = (await res.json()) as T & { exception?: string; message?: string };
    if (data && typeof data === 'object' && 'exception' in data && data.exception) {
      throw new Error(data.message || `Moodle Web Service exception: ${data.exception}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function getMoodleAdapterStatus(): Promise<MoodleAdapterStatus> {
  const configured = isMoodleConfigured();
  const base: MoodleAdapterStatus = {
    configured,
    authMethod: 'moodle_webservice_rest_token',
    baseUrlHost: getSafeBaseUrlHost(),
    supportedFunctions: [
      'core_webservice_get_site_info',
      'core_course_get_courses',
      'core_enrol_get_enrolled_users',
    ],
    securityGuarantee:
      'Uses only authorised university Moodle Web Services REST tokens (webservice/rest/server.php). Never scrapes HTML or bypasses university LMS authentication.',
  };

  if (!configured) {
    return base;
  }

  try {
    const info = await callMoodleRest<{ sitename?: string; release?: string }>(
      'core_webservice_get_site_info'
    );
    return {
      ...base,
      siteName: info.sitename,
      moodleRelease: info.release,
    };
  } catch {
    return base;
  }
}

export async function syncAuthorisedMoodleCourses(): Promise<MoodleCourseSyncResult> {
  if (!isMoodleConfigured()) {
    return {
      configured: false,
      authMethod: 'moodle_webservice_rest_token',
      courses: [],
      message:
        'Authorised Moodle Web Services token not configured on server (set MOODLE_BASE_URL and MOODLE_WS_TOKEN in environment variables). Returning schema mapping contract only.',
      fieldMapping: MOODLE_FIELD_MAPPING,
    };
  }

  const rawCourses = await callMoodleRest<
    Array<{
      id: number;
      shortname?: string;
      fullname?: string;
      displayname?: string;
      categoryid?: number;
      visible?: number;
      startdate?: number;
    }>
  >('core_course_get_courses');

  const filtered = (Array.isArray(rawCourses) ? rawCourses : [])
    .filter((c) => c.id > 1)
    .slice(0, 50)
    .map((c) => ({
      moodleId: c.id,
      courseCode: c.shortname || `MDL-${c.id}`,
      fullName: c.fullname || c.displayname || `Moodle Course ${c.id}`,
      visible: c.visible !== 0,
      startDateIso:
        typeof c.startdate === 'number' && c.startdate > 0
          ? new Date(c.startdate * 1000).toISOString().slice(0, 10)
          : undefined,
    }));

  return {
    configured: true,
    authMethod: 'moodle_webservice_rest_token',
    courses: filtered,
    message: `Retrieved ${filtered.length} authorised Moodle courses via core_course_get_courses.`,
    fieldMapping: MOODLE_FIELD_MAPPING,
  };
}
