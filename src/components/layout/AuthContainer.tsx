export function AuthContainer({
  children,
  showBackButton = false,
  onBackClick
}: {
  children: React.ReactNode
  showBackButton?: boolean
  onBackClick?: () => void
}) {
  return (
    <div className='container-fluid min-vh-100 bg-light d-flex align-items-center justify-content-center py-5'>
      {showBackButton && (
        <button
          className='btn btn-link text-secondary  position-absolute top-0 start-0 ms-3 mt-4'
          onClick={onBackClick}
          style={{ textDecoration: 'none' }}
        >
          &lt; Back
        </button>
      )}
      <header className='position-fixed top-0 start-50 translate-middle-x mt-4 d-flex align-items-center'>
        <img
          src='https://res.cloudinary.com/dm5ulzy7n/image/upload/v1748241850/Logomark--f3fdd531-16f0-49e0-afd2-f4db264d4ae4.png'
          alt='Logo'
          className='me-2'
          style={{ width: '30px', height: '30px' }}
        />
        <h1 className='h3 m-0 fw-bold' style={{color: "#4a68d6"}}>OLA SOCIAL</h1>
      </header>
      <div className='row justify-content-center w-75' style={{ paddingTop: '60px' }}>
        <div className='col-12 col-sm-10 col-md-8 col-lg-6 col-xl-4'>{children}</div>
      </div>
    </div>
  )
}
