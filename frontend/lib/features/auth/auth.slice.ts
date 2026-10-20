import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthState } from '@/types/auth'

const initialState: AuthState = {
  username: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticatedUser: (state, action: PayloadAction<string>) => {
      state.username = action.payload
      state.isAuthenticated = true
    },
    clearAuthenticatedUser: (state) => {
      state.username = null
      state.isAuthenticated = false
    },
  },
})

export const { setAuthenticatedUser, clearAuthenticatedUser } = authSlice.actions
export default authSlice.reducer
