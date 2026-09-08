export const templates = ['Site', 'Plant', 'Workshop', 'Field', 'Studio', 'Office', 'Clinic', 'Community'];
export const phases = ['induct', 'shadow', 'perform', 'prove'];
export function createProject(title, template, id) {
  const project = { schemaVersion: 1, kind: 'milzet-authoring-draft', id, title: title.trim(), template, targets: ['webxr', 'unity'], assets: [], scenes: [], bindings: [], phases: phases.map(id => ({ id, steps: [] })) };
  validateProject(project);
  return project;
}
export function validateProject(value) {
  const fail = message => { throw new Error(message); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Expected a project object.');
  const keys = ['schemaVersion','kind','id','title','template','targets','assets','scenes','bindings','phases'];
  if (Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !(key in value))) fail('Unexpected or missing project fields.');
  if (value.schemaVersion !== 1 || value.kind !== 'milzet-authoring-draft') fail('Unsupported project format.');
  if (typeof value.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(value.id)) fail('Invalid project identifier.');
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 120) fail('Enter a title of 1–120 characters.');
  if (!templates.includes(value.template)) fail('Unknown scene template.');
  if (JSON.stringify(value.targets) !== JSON.stringify(['webxr','unity'])) fail('Both playback targets are required.');
  for (const key of ['assets','scenes','bindings']) if (!Array.isArray(value[key]) || value[key].length) fail('This foundation opens empty drafts only; populated packages need the upcoming importer.');
  if (!Array.isArray(value.phases) || value.phases.length !== 4) fail('Four content phases are required.');
  for (const [i, phase] of value.phases.entries()) {
    if (!phase || Object.keys(phase).sort().join(',') !== 'id,steps' || phase.id !== phases[i] || !Array.isArray(phase.steps) || phase.steps.length) fail('Invalid or unsupported phase content.');
  }
  return value;
}
export function parseProject(text) {
  if (text.length > 1000000) throw new Error('Draft exceeds the 1 MB limit.');
  return validateProject(JSON.parse(text));
}
