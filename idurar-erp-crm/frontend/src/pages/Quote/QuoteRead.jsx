import { useState } from 'react';
import { Modal, Input, Button, Space, Form } from 'antd';
import { BulbOutlined, MailOutlined } from '@ant-design/icons';

import useLanguage from '@/locale/useLanguage';
import ReadQuoteModule from '@/modules/QuoteModule/ReadQuoteModule';
import useMail from '@/hooks/useMail';
import { request } from '@/request';

export default function QuoteRead() {
  const entity = 'quote';
  const translate = useLanguage();

  const { send, isLoading: mailInProgress } = useMail({ entity });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [subject, setSubject] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Ask the backend (OpenAI) for a suggested subject. The result only prefills
  // the field, so the user can still edit it manually before sending.
  const suggestSubject = async (quote) => {
    setIsSuggesting(true);
    try {
      const { result } = await request.post({
        entity: 'quote/suggestEmailSubject',
        jsonData: {
          number: quote?.number,
          year: quote?.year,
          total: quote?.total,
          currency: quote?.currency,
          clientName: quote?.client?.name,
        },
      });
      if (result?.subject) setSubject(result.subject);
    } catch (error) {
      // Keep whatever is already typed; sending stays available.
    } finally {
      setIsSuggesting(false);
    }
  };

  const openEmailModal = (quote) => {
    setCurrentQuote(quote);
    setSubject('');
    setIsModalOpen(true);
    suggestSubject(quote);
  };

  const closeEmailModal = () => {
    setIsModalOpen(false);
    setCurrentQuote(null);
    setSubject('');
  };

  const handleSend = () => {
    if (!currentQuote?._id) return;
    send(currentQuote._id, subject?.trim() || undefined);
    closeEmailModal();
  };

  const Labels = {
    PANEL_TITLE: translate('quote'),
    DATATABLE_TITLE: translate('quote_list'),
    ADD_NEW_ENTITY: translate('add_new_quote'),
    ENTITY_NAME: translate('quote'),
    RECORD_ENTITY: translate('record_payment'),
  };

  const configPage = {
    entity,
    ...Labels,
    sendByEmail: openEmailModal,
  };

  return (
    <>
      <ReadQuoteModule config={configPage} />
      <Modal
        title={translate('Send by Email')}
        open={isModalOpen}
        onCancel={closeEmailModal}
        footer={[
          <Button key="cancel" onClick={closeEmailModal}>
            {translate('Cancel')}
          </Button>,
          <Button
            key="send"
            type="primary"
            icon={<MailOutlined />}
            loading={mailInProgress}
            onClick={handleSend}
          >
            {translate('Send')}
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label={translate('email subject')} style={{ marginBottom: 8 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={subject}
                placeholder={translate('email subject')}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Button
                icon={<BulbOutlined />}
                loading={isSuggesting}
                onClick={() => suggestSubject(currentQuote)}
              >
                {translate('suggest with ai')}
              </Button>
            </Space.Compact>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
