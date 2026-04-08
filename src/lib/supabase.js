// ============================================================
// supabase.js — initialize once, import everywhere
// npm install @supabase/supabase-js
// ============================================================

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Simple in-memory cache
const _cache = {
  categories: null,
  listings: {}, // key: JSON.stringify(opts)
  expiry: 1000 * 60 * 5 // 5 minutes default
}

export function clearCache() {
  _cache.categories = null
  _cache.listings = {}
}


// ============================================================
// AUTH
// ============================================================

// Register new user
export async function signUp(email, password, fullName) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  })
}

// Login
export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

// Logout
export async function signOut() {
  return supabase.auth.signOut()
}

// Get current session
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}


// ============================================================
// PROFILES
// ============================================================

// Get a seller's profile by user ID
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// Update the current user's profile (including their map location)
export async function updateProfile(userId, updates) {
  // updates can include: full_name, bio, avatar_url, city, lat, lng
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Upload a profile avatar
export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const storagePath = `${userId}/${filename}`

  // Try standard avatars bucket
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, file, { cacheControl: '3600', upsert: true })
  
  if (uploadError) {
    // Fallback to listing-images if avatars doesn't exist
    console.warn('Could not upload to avatars bucket, falling back to listing-images:', uploadError)
    const fallbackPath = `avatars/${userId}/${filename}`
    const res = await supabase.storage.from('listing-images').upload(fallbackPath, file, { upsert: true })
    if (res.error) throw res.error
    return supabase.storage.from('listing-images').getPublicUrl(fallbackPath).data.publicUrl
  }

  return supabase.storage.from('avatars').getPublicUrl(storagePath).data.publicUrl
}


// ============================================================
// LISTINGS — browse & search
// ============================================================

// Get all active listings (with primary image + seller info)
export async function getListings(opts = {}) {
  const cacheKey = JSON.stringify(opts)
  const cached = _cache.listings[cacheKey]
  if (cached && (Date.now() - cached.timestamp < _cache.expiry)) {
    return cached.data
  }

  const { categoryId, search, limit = 20, offset = 0 } = opts
  let query = supabase
    .from('listings')
    .select(`
      id, title, description, price, condition, created_at, lat, lng,
      seller:profiles(id, full_name, avatar_url, city),
      category:categories(name, slug),
      images:listing_images(public_url, is_primary)
    `)
    .eq('is_active', true)
    .eq('is_sold', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (categoryId) query = query.eq('category_id', categoryId)
  if (search)     query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) throw error

  // Cache it
  _cache.listings[cacheKey] = { data, timestamp: Date.now() }
  return data
}

// Get a single listing with all images
export async function getListing(listingId) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      seller:profiles(id, full_name, avatar_url, bio, city, lat, lng),
      category:categories(name, slug),
      images:listing_images(id, public_url, is_primary, display_order)
    `)
    .eq('id', listingId)
    .single()
  if (error) throw error
  return data
}

// Get all listings by a specific seller (for their dashboard)
export async function getMyListings(sellerId) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *, images:listing_images(public_url, is_primary)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}


// ============================================================
// LISTINGS — create, update, delete
// ============================================================

// Create a new listing
export async function createListing(sellerId, listingData) {
  const { data, error } = await supabase
    .from('listings')
    .insert({ seller_id: sellerId, ...listingData })
    .select()
    .single()
  if (error) throw error
  return data
}

// Update a listing (edit title, price, etc., or mark as sold)
export async function updateListing(listingId, updates) {
  const { data, error } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', listingId)
    .select()
  
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('Update failed: No row updated. This might be due to permissions (RLS).')
  }
  return data[0]
}

// Delete a listing (and cascade-deletes its images from DB)
export async function deleteListing(listingId) {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
  if (error) throw error
}

// Mark a listing as sold
export async function markAsSold(listingId) {
  clearCache()
  return updateListing(listingId, { is_sold: true })
}

// Mark a listing as active again
export async function markAsActive(listingId) {
  clearCache()
  return updateListing(listingId, { is_sold: false })
}


// ============================================================
// IMAGES — upload, attach, delete
// ============================================================

// Upload a photo and attach it to a listing
// Usage: await uploadListingImage(sellerId, listingId, file)
export async function uploadListingImage(sellerId, listingId, file, isPrimary = false) {
  // 1. Build a unique path inside the bucket
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const storagePath = `listings/${sellerId}/${listingId}/${filename}`

  // 2. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('listing-images')
    .upload(storagePath, file, { cacheControl: '3600', upsert: false })
  if (uploadError) throw uploadError

  // 3. Get the public CDN URL
  const { data: urlData } = supabase.storage
    .from('listing-images')
    .getPublicUrl(storagePath)

  // 4. Save the image record in the DB
  const { data, error } = await supabase
    .from('listing_images')
    .insert({
      listing_id: listingId,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      is_primary: isPrimary,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Delete an image (removes from Storage + DB)
export async function deleteListingImage(imageId, storagePath) {
  // 1. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('listing-images')
    .remove([storagePath])
  if (storageError) throw storageError

  // 2. Delete from DB
  const { error } = await supabase
    .from('listing_images')
    .delete()
    .eq('id', imageId)
  if (error) throw error
}


// ============================================================
// MAP — find sellers near a location (uses the RPC function)
// ============================================================

// Returns sellers within `radiusKm` kilometres of (lat, lng)
// Each result includes: id, full_name, avatar_url, city, lat, lng,
//                       distance_km, listing_count
export async function getSellersNearMe(lat, lng, radiusKm = 10) {
  const { data, error } = await supabase.rpc('sellers_near_me', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
  })
  if (error) throw error
  return data
}

// Get user's current browser location (returns Promise<{lat, lng}>)
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err)
    )
  })
}


// ============================================================
// CATEGORIES
// ============================================================

export async function getCategories() {
  if (_cache.categories && (Date.now() - _cache.categories.timestamp < _cache.expiry)) {
    return _cache.categories.data
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error

  _cache.categories = { data, timestamp: Date.now() }
  return data
}


// ============================================================
// CHAT — public key management
// ============================================================

export async function savePublicKey(userId, pubKeyB64) {
  const { error } = await supabase
    .from('profiles')
    .update({ public_key: pubKeyB64 })
    .eq('id', userId)
  if (error) throw error
}

export async function getPublicKey(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('public_key')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data?.public_key ?? null
}

// ============================================================
// CHAT — conversations
// ============================================================

export async function getOrCreateChat(buyerId, sellerId, listingId) {
  // Try to find existing
  const { data: existing } = await supabase
    .from('chats')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .eq('listing_id', listingId)
    .maybeSingle()
  if (existing) return existing

  // Create new
  const { data, error } = await supabase
    .from('chats')
    .insert({ buyer_id: buyerId, seller_id: sellerId, listing_id: listingId })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function getMyChats(userId) {
  const { data, error } = await supabase
    .from('chats')
    .select(`
      id, created_at, listing_id,
      listing:listings(id, title, images:listing_images(public_url, is_primary)),
      buyer:profiles!chats_buyer_id_fkey(id, full_name, avatar_url, public_key),
      seller:profiles!chats_seller_id_fkey(id, full_name, avatar_url, public_key)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ============================================================
// CHAT — messages
// ============================================================

export async function getChatMessages(chatId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, chat_id, sender_id, encrypted_content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function sendEncryptedMessage(chatId, senderId, encryptedPayload) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      encrypted_content: JSON.stringify(encryptedPayload),
    })
    .select('id, chat_id, sender_id, encrypted_content, created_at')
    .single()
  if (error) throw error
  return data
}

export function subscribeToMessages(chatId, onInsert) {
  return supabase
    .channel(`messages:chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => onInsert(payload.new)
    )
    .subscribe()
}

// Fetch unread counts for all chats in one query.
// lastReadMap = { chatId: timestampMs, ... }  (from localStorage)
export async function getUnreadCounts(userId, lastReadMap) {
  const chatIds = Object.keys(lastReadMap)
  if (!chatIds.length) return {}

  const { data, error } = await supabase
    .from('messages')
    .select('chat_id, created_at')
    .in('chat_id', chatIds)
    .neq('sender_id', userId)

  if (error || !data) return {}

  const counts = {}
  data.forEach(msg => {
    const last = lastReadMap[msg.chat_id] || 0
    if (new Date(msg.created_at).getTime() > last) {
      counts[msg.chat_id] = (counts[msg.chat_id] || 0) + 1
    }
  })
  return counts
}
