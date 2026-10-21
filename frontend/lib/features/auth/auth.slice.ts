import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthState } from '@/types/auth'

const initialState: AuthState = {
  username: null,
  status: 'idle',
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticatedUser: (state, action: PayloadAction<string>) => {
      state.username = action.payload
      state.status = 'authenticated'
      state.isAuthenticated = true
    },
    clearAuthenticatedUser: (state) => {
      state.username = null
      state.status = 'unauthenticated'
      state.isAuthenticated = false
    },
    setAuthLoading: (state) => {
      state.status = 'loading'
    },
    setUnauthenticated: (state) => {
      state.username = null
      state.status = 'unauthenticated'
      state.isAuthenticated = false
    },
  },
})

export const {
  setAuthenticatedUser,
  clearAuthenticatedUser,
  setAuthLoading,
  setUnauthenticated,
} = authSlice.actions
export default authSlice.reducer
