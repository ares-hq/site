import EventTemplate from '@/components/templates/EventTemplate';
import React from 'react';

const EventsPage = () => (
  <EventTemplate
    pageTitle="All Events"
    summary="Every event on the season calendar. Filter by status or month, then open one for its rankings, scoring breakdown and full match results."
  />
);

export default EventsPage;
