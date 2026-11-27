// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CourseEnrollButton } from '@/components/course/course-enroll-button';
import { CourseViewClient } from '@/components/course/course-view-client';
import { CoursePlayer } from '@/components/course/course-player';
import { DashboardPaywallWrapper } from '@/components/dashboard/dashboard-paywall-wrapper';
import { PrivateOwnerBoundary } from '@/components/auth/private-owner-boundary';

const mocks=vi.hoisted(()=>({post:vi.fn(),get:vi.fn(),put:vi.fn(),fetch:vi.fn(),assign:vi.fn(),toast:vi.fn(),language:'en',listeners:new Set<(event:string,session:unknown)=>void>()}));
vi.mock('axios',()=>({default:{post:mocks.post,get:mocks.get,put:mocks.put,isAxiosError:(error:unknown)=>Boolean((error as {isAxiosError?:boolean})?.isAxiosError)}}));
vi.mock('sonner',()=>({toast:{error:mocks.toast,success:vi.fn()}}));
vi.mock('next/navigation',()=>({usePathname:()=>'/dashboard/courses',useSearchParams:()=>new URLSearchParams(),useRouter:()=>({push:vi.fn(),replace:vi.fn(),refresh:vi.fn()})}));
vi.mock('next/image',()=>({default:()=>null}));
vi.mock('@/components/providers/language-provider',()=>({useLanguage:()=>({language:mocks.language,setLanguage:vi.fn()})}));
vi.mock('@/components/providers/dashboard-preferences-provider',()=>({useDashboardPreferences:()=>({language:mocks.language,t:(_key:string,fallback:string)=>fallback}),DashboardPreferencesProvider:({children}:{children:ReactNode})=>children}));
vi.mock('@/components/layout/sidebar',()=>({Sidebar:()=>null}));
vi.mock('@/components/music/spotify-playlist-footer',()=>({SpotifyPlaylistFooter:()=>null}));
vi.mock('@/lib/payment-modal-loader',()=>({warmPaymentMethodModal:vi.fn(),loadPaymentMethodModal:vi.fn()}));
vi.mock('next/dynamic',async()=>{
 const {PaymentMethodModal}=await import('@/components/payment/payment-method-modal');
 return {default:(loader:()=>Promise<unknown>)=>String(loader).includes('loadPaymentMethodModal')?PaymentMethodModal:()=>null};
});
vi.mock('@/utils/supabase/client',()=>({createClient:()=>({auth:{onAuthStateChange:(listener:(event:string,session:unknown)=>void)=>{
 mocks.listeners.add(listener);listener('INITIAL_SESSION',{user:{id:'synthetic-checkout-owner'}});
 return {data:{subscription:{unsubscribe:()=>mocks.listeners.delete(listener)}}};
}}})}));

const OWNER='synthetic-checkout-owner',COURSE='synthetic-checkout-course';
const result={data:{url:'https://checkout.synthetic.example/owned'}};
type Kind='enroll'|'course-view'|'paywall'|'player';
const cases=[
 {kind:'enroll',language:'en',trigger:'Apply voucher and continue',message:'Your session changed. Refresh the page before continuing.'},
 {kind:'course-view',language:'es',trigger:/^Comprar curso completo/,message:'Tu sesión cambió. Actualiza la página antes de continuar.'},
 {kind:'paywall',language:'fr',trigger:'Appliquer un code et continuer',message:'Votre session a changé. Actualisez la page avant de continuer.'},
 {kind:'player',language:'pt',trigger:'Escolher método de pagamento',message:'Sua sessão mudou. Atualize a página antes de continuar.'},
] as const;
let finish:Array<()=>void>;
function deferred(){let resolve!:(value:typeof result)=>void,reject!:(value:unknown)=>void;const promise=new Promise<typeof result>((yes,no)=>{resolve=yes;reject=no;});finish.push(()=>resolve(result));return {promise,resolve,reject};}
function owner(event:string,id:string|null){for(const listener of [...mocks.listeners])listener(event,id?{user:{id}}:null);}
function player(){
 const lesson={id:'synthetic-checkout-lesson',title:'Synthetic class',videoUrl:'',attachments:[]};
 const course={id:COURSE,title:'Synthetic course',description:'Synthetic fixture',price:80,chapters:[{id:'synthetic-checkout-chapter',lessons:[lesson]}]};
 return <CoursePlayer currentUserId={OWNER} course={course as unknown as ComponentProps<typeof CoursePlayer>['course']} lesson={lesson as unknown as ComponentProps<typeof CoursePlayer>['lesson']} lessonId={lesson.id} initialIsCompleted={false} initialProgressPercent={0} initialQuizSummary={null} hasQuizAvailable={false} canUseGamification={false} canAccessLesson={false} canAccessAttachments={false}/>;
}
async function start(kind:Kind,language='en'){
 mocks.language=language;
 const item=cases.find(item=>item.kind===kind)!;
 const content=kind==='enroll'?<CourseEnrollButton courseId={COURSE} price={80}/>:kind==='course-view'?<CourseViewClient userName="Synthetic owner" hasPurchased={false} courseId={COURSE} coursePrice={80} lessonRoutesByTitle={{}} lessonRoutesInOrder={[]} lessonIdsInOrder={[]} lessonTitlesInOrder={[]}/>:kind==='paywall'?<DashboardPaywallWrapper hasPaidCourse={false} courseId={COURSE} coursePrice={80}><p>Synthetic child</p></DashboardPaywallWrapper>:player();
 const view=render(<PrivateOwnerBoundary expectedUserId={OWNER}>{content}</PrivateOwnerBoundary>);
 const trigger=kind==='player'&&language==='en'?'Choose payment method':item.trigger;
 const user=userEvent.setup();
 await user.click(screen.getAllByRole('button',{name:trigger})[0]);
 await user.click(await screen.findByTestId('payment-method-modal-continue'));
 await waitFor(()=>expect(mocks.post).toHaveBeenCalledOnce());
 return view;
}
beforeEach(()=>{
 vi.clearAllMocks();mocks.listeners.clear();finish=[];mocks.language='en';localStorage.clear();
 mocks.fetch.mockImplementation(()=>{throw new Error('Network prohibited in closed checkout fixture');});
 mocks.get.mockImplementation(()=>{throw new Error('Media/provider GET prohibited');});
 mocks.put.mockImplementation(()=>{throw new Error('Learning PUT prohibited');});
 vi.stubGlobal('fetch',mocks.fetch);
 const actual=window;
 const location=new Proxy({}, {get:(_target,property)=>property==='assign'?mocks.assign:Reflect.get(actual.location,property,actual.location)});
 vi.stubGlobal('window',new Proxy(actual,{get:(target,property)=>property==='location'?location:Reflect.get(target,property,target)}));
});
afterEach(async()=>{cleanup();await act(async()=>{for(const done of finish)done();});mocks.listeners.clear();expect(mocks.fetch).not.toHaveBeenCalled();expect(mocks.get).not.toHaveBeenCalled();expect(mocks.put).not.toHaveBeenCalled();vi.unstubAllGlobals();});

describe('checkout client intent bound to captured owner, independent of server-cookie authorization',()=>{
 test.each(cases)('$kind actual POST carries captured owner query without altering purchase intent',async({kind,language})=>{
  const pending=deferred();mocks.post.mockReturnValue(pending.promise);await start(kind,language);
  const [path,body]=mocks.post.mock.calls[0];const url=new URL(path,'http://localhost');
  expect(url.pathname).toBe('/api/checkout');expect(url.searchParams.getAll('expectedUserId')).toEqual([OWNER]);
  expect(body).toEqual({courseId:COURSE,language,voucherCode:undefined,...(kind==='enroll'?{}:{source:'dashboard'})});
  expect(mocks.assign).not.toHaveBeenCalled();
 });
 test.each(cases)('$kind specific Session changed409 shows localized manual refresh without retry',async({kind,language,message})=>{
  mocks.post.mockRejectedValue({isAxiosError:true,response:{status:409,data:{error:'Session changed'}}});await start(kind,language);
  expect(await within(screen.getByTestId('payment-method-modal')).findByText(message)).toBeTruthy();expect(mocks.post).toHaveBeenCalledOnce();expect(mocks.assign).not.toHaveBeenCalled();
 });
 test('unrelated voucher409 string retains its feedback instead of becoming session-refresh advice',async()=>{
  mocks.post.mockRejectedValue({isAxiosError:true,response:{status:409,data:'Synthetic voucher no longer available'}});await start('enroll');
  expect(await screen.findByText('Synthetic voucher no longer available')).toBeTruthy();expect(screen.queryByText(cases[0].message)).toBeNull();expect(mocks.post).toHaveBeenCalledOnce();expect(mocks.assign).not.toHaveBeenCalled();
 });
});
describe('actual CoursePlayer checkout work retains current owner/frame rules',()=>{
 test('same-owner token refresh keeps legitimate delayed checkout navigation',async()=>{const pending=deferred();mocks.post.mockReturnValue(pending.promise);await start('player');await act(async()=>owner('TOKEN_REFRESHED',OWNER));await act(async()=>pending.resolve(result));expect(mocks.assign).toHaveBeenCalledExactlyOnceWith(result.data.url);});
 test('different owner cannot follow the prior player checkout response',async()=>{const pending=deferred();mocks.post.mockReturnValue(pending.promise);await start('player');await act(async()=>owner('SIGNED_IN','synthetic-other-owner'));await act(async()=>pending.resolve(result));expect(mocks.assign).not.toHaveBeenCalled();});
 test('signed-out owner cannot display late session409 feedback',async()=>{const pending=deferred();mocks.post.mockReturnValue(pending.promise);await start('player');await act(async()=>owner('SIGNED_OUT',null));await act(async()=>pending.reject({isAxiosError:true,response:{status:409,data:{error:'Session changed'}}}));expect(mocks.toast).not.toHaveBeenCalled();expect(screen.queryByText(cases[0].message)).toBeNull();expect(mocks.assign).not.toHaveBeenCalled();});
 test('unmounted player cannot display late session409 feedback or navigate',async()=>{const pending=deferred();mocks.post.mockReturnValue(pending.promise);const view=await start('player');view.unmount();await act(async()=>pending.reject({isAxiosError:true,response:{status:409,data:{error:'Session changed'}}}));expect(mocks.toast).not.toHaveBeenCalled();expect(screen.queryByText(cases[0].message)).toBeNull();expect(mocks.assign).not.toHaveBeenCalled();});
});
