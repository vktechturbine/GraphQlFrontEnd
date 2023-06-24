import React, { Component } from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';

class SinglePost extends Component {
  state = {
    title: '',
    author: '',
    date: '',
    image: '',
    content: ''
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;
    console.log(postId);
    const graphqlQuery = {
      query: `
      query FetchSinglePost($postId:ID!){
        post(id: $postId) {
          title
          content
          imageUrl
          creator {
            name
          }
          createdAt
        }
      }
    `,
      variables: {
        postId: postId
      }
    }
    fetch('https://feed-backend-api.onrender.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    }).then(res => {
      return res.json();
    }).then(resData => {
      console.log(resData);
      if (!resData) {
        throw new Error('Post Fetch Falied')
      }

      this.setState({
        title: resData.data.post.title,
        author: resData.data.post.creator.name,
        imageUrl: resData.data.post.imageUrl,
        date: new Date(resData.data.post.createdAt).toLocaleDateString('en-US'),
        content: resData.data.post.content
      });
    })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.imageUrl} />
        </div>
        <p>{this.state.content}</p>
      </section>
    );
  }
}

export default SinglePost;
