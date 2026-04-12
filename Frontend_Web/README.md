
  # Tamely Web

  This is a code bundle for Tamely Web. The original project is available at https://www.figma.com/design/67DRAMJmcRwOOXKoZ3Cpe6/Tamely-Web.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Calling across networks

  Voice/video calls use WebRTC. For users on different Wi-Fi or mobile networks, configure a TURN relay in Vercel with:

  `VITE_TURN_URLS`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`

  Without TURN, signaling can succeed while media never connects, which looks like the call was accepted but no one can hear each other.
  
