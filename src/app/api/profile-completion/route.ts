import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  skill_level?: number;
  preferred_position?: string;
  place_name?: string;
  city?: string;
}

function isProfileIncomplete(profile: Profile | null): boolean {
  if (!profile) return true;

  const requiredFields = [
    profile.phone,
    profile.skill_level && profile.skill_level > 1, // No es principiante
    profile.preferred_position,
    profile.place_name || profile.city, // Al menos uno de los dos
  ];

  return requiredFields.some((field) => !field);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        profile: null, 
        shouldShow: false 
      });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone, skill_level, preferred_position, place_name, city')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json({ 
        profile: null, 
        shouldShow: false 
      });
    }

    const shouldShow = isProfileIncomplete(profile);

    return NextResponse.json({ 
      profile, 
      shouldShow 
    });
  } catch (error) {
    console.error('Error in profile-completion API:', error);
    return NextResponse.json({ 
      profile: null, 
      shouldShow: false 
    }, { status: 500 });
  }
}