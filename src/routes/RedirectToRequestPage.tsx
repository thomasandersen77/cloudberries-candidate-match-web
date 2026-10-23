import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/** `/project-requests/{id}` was the second page of a request; the request has one page now (plan C1). */
const RedirectToRequestPage: React.FC = () => {
  const { id } = useParams();
  return <Navigate to={`/matches/${id}`} replace />;
};

export default RedirectToRequestPage;
