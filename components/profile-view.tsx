import { Bookmark, ChevronRight, Compass, Feather } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { Header, Meta } from '@/components/shared'
import { signOut } from '@/app/actions'

const icons = { bookmark: Bookmark, feather: Feather, compass: Compass }

export default function ProfileView({ profile }: { profile: Profile }) {
  return <div className="page-wrap"><Header /><main><section className="profile-hero"><div className="profile-avatar">{profile.initials}</div><Meta>{profile.memberSince}</Meta><h1>{profile.name}</h1><p>{profile.tagline}</p></section><div className="profile-stats">{profile.stats.map(stat => <div key={stat.label}><strong>{stat.value}</strong><Meta>{stat.label}</Meta></div>)}</div><section className="profile-links">{profile.links.map(link => { const Icon = icons[link.icon]; return <button key={link.id}><Icon size={19} /><span>{link.label}</span><ChevronRight size={17} /></button> })}</section><button className="outline-button">Edit profile</button><form action={async () => { 'use server'; await signOut() }}><button className="outline-button">Sign out</button></form></main></div>
}
