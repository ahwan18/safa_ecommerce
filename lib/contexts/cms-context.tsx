'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { CMSContent } from '@/lib/types'

interface CMSContextType {
  content: CMSContent[]
  loading: boolean
  updateContent: (section: string, data: Record<string, any>) => Promise<void>
  getContent: (section: string) => Record<string, any> | undefined
}

const CMSContext = createContext<CMSContextType | undefined>(undefined)

export function CMSProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<CMSContent[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ FETCH DATA
  const fetchContent = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('cms_content')
        .select('*')

      if (error) {
        console.error('Supabase CMS fetch error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return
      }

      setContent(data || [])
    } catch (err) {
      console.error('Unexpected CMS fetch error:', err instanceof Error ? err.message : err)
    } finally {
      setLoading(false)
    }
  }

  // load pertama kali
  useEffect(() => {
    fetchContent()
  }, [])

  // ✅ UPDATE DATA
  const updateContent = async (section: string, data: Record<string, any>) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase is not configured. CMS content was not saved.')
      return
    }

    try {
      const { error } = await supabase
        .from('cms_content')
        .upsert(
          {
            section_name: section,
            content: data
          },
          { onConflict: 'section_name' }
        )

      if (error) {
        console.error('Supabase CMS update error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return
      }

      await fetchContent()
    } catch (err) {
      console.error('Unexpected CMS update error:', err instanceof Error ? err.message : err)
    }
  }

  // ✅ GET BY SECTION
  const getContent = (section: string) => {
    return content.find(c => c.section_name === section)?.content
  }

  return (
    <CMSContext.Provider value={{ content, loading, updateContent, getContent }}>
      {children}
    </CMSContext.Provider>
  )
}

export function useCMS() {
  const context = useContext(CMSContext)

  if (!context) {
    throw new Error('useCMS must be used within CMSProvider')
  }

  return context
}
