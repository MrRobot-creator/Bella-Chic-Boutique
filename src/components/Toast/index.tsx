import styled, { keyframes } from 'styled-components'
import { colors, fonts } from '../../styles/tokens'

const pop = keyframes`from { opacity: 0; transform: translate(-50%, 12px) } to { opacity: 1; transform: translate(-50%, 0) }`

const Box = styled.div`
  position: fixed;
  left: 50%;
  bottom: 28px;
  z-index: 200;
  max-width: calc(100vw - 32px);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-radius: 999px;
  background: ${colors.plum};
  color: ${colors.white};
  font: 500 14px ${fonts.sans};
  box-shadow: 0 14px 34px rgba(46, 30, 34, .3);
  transform: translateX(-50%);
  animation: ${pop} .25s ease-out;
  .check { width: 22px; height: 22px; flex: none; display: grid; place-items: center; border-radius: 50%; background: ${colors.logoPink}; color: ${colors.plum}; font-size: 13px; font-weight: 700; }
  @media (max-width: 480px) { bottom: 18px; border-radius: 18px; }
`

const Toast = ({ message }: { message: string }) => (
  <div role="status" aria-live="polite">
    {message && <Box><span className="check" aria-hidden="true">✓</span>{message}</Box>}
  </div>
)

export default Toast
