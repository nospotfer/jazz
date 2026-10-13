export type ResetArgs = {
  userId: string;
  courseId: string;
  codes: string[];
  dryRun: boolean;
};

export function parseResetUserVoucherArgs(argv: string[]): ResetArgs {
  let userId = '';
  let courseId = '';
  let apply = false;
  let explicitDryRun = false;
  let codes: string[] = [];

  for (const arg of argv) {
    if (arg === '--apply') apply = true;
    else if (arg === '--dry-run') explicitDryRun = true;
    else if (arg.startsWith('--user-id=')) userId = arg.slice('--user-id='.length).trim();
    else if (arg.startsWith('--course-id=')) courseId = arg.slice('--course-id='.length).trim();
    else if (arg.startsWith('--codes=')) codes = arg.slice('--codes='.length).split(',').map((code) => code.trim()).filter(Boolean);
    else throw new Error('Unknown reset argument.');
  }
  if (!userId || !courseId) throw new Error('Both --user-id=<id> and --course-id=<id> are required.');
  if (apply && explicitDryRun) throw new Error('Choose either --apply or --dry-run.');
  return { userId, courseId, codes: [...new Set(codes)], dryRun: !apply };
}
